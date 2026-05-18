const nodemailer = require('nodemailer');

console.log('📧 [MAIL.JS] Загрузка модуля...');
console.log('📧 EMAIL_ENABLED:', process.env.EMAIL_ENABLED);
console.log('📧 SMTP_HOST:', process.env.SMTP_HOST);
console.log('📧 SMTP_USER:', process.env.SMTP_USER);

const config = {
    host: process.env.SMTP_HOST || 'smtp.yandex.ru',
    port: process.env.SMTP_PORT || 465,
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
};

console.log('📧 Конфиг:', { host: config.host, port: config.port, user: config.auth.user, passSet: !!config.auth.pass });

const transporter = nodemailer.createTransport(config);

async function sendMail({ to, subject, html, text }) {
    console.log(`📧 [sendMail] Вызвана с to: ${to}`);
    
    if (!to) {
        console.warn('📧 Нет email получателя');
        return;
    }
    
    if (!config.auth.user || !config.auth.pass) {
        console.warn('📧 Нет учетных данных SMTP (user/pass)');
        return;
    }
    
    try {
        console.log(`📧 Попытка отправки на ${to}...`);
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || config.auth.user,
            to,
            subject,
            html,
            text
        });
        console.log(`✅ Email отправлен на ${to}`, info.messageId);
    } catch (error) {
        console.error(`❌ Ошибка отправки email на ${to}:`, error.message);
        console.error(error);
    }
}

function isEmailEnabled() {
    const enabled = process.env.EMAIL_ENABLED === 'true' && !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS;
    console.log(`📧 isEmailEnabled: ${enabled}`);
    return enabled;
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000,  // 10 секунд
    greetingTimeout: 10000,
    socketTimeout: 10000,
});

module.exports = { sendMail, isEmailEnabled };
