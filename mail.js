const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;
    
    console.log('📧 Создание SMTP транспорта...');
    console.log('📧 SMTP_HOST:', process.env.SMTP_HOST);
    console.log('📧 SMTP_PORT:', process.env.SMTP_PORT);
    console.log('📧 SMTP_USER:', process.env.SMTP_USER);
    
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.yandex.ru',
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: parseInt(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        debug: true,  // Включить отладку
        logger: true, // Включить логирование
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
    });
    
    return transporter;
}

async function sendMail({ to, subject, html, text }) {
    console.log(`📧 sendMail() вызван для: ${to}`);
    console.log(`📧 subject: ${subject}`);
    
    if (!to) {
        console.warn('❌ Нет email получателя');
        return;
    }
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('❌ Нет SMTP_USER или SMTP_PASS');
        return;
    }
    
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: to,
            subject: subject,
            html: html || text,
            text: text || html,
        };
        
        console.log('📧 Отправка через nodemailer...');
        const info = await getTransporter().sendMail(mailOptions);
        console.log(`✅ Письмо успешно отправлено! ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`❌ ОШИБКА отправки:`, error.message);
        console.error(error);
        throw error;
    }
}

function isEmailEnabled() {
    const enabled = process.env.EMAIL_ENABLED === 'true' && 
                    !!process.env.SMTP_HOST && 
                    !!process.env.SMTP_USER && 
                    !!process.env.SMTP_PASS;
    console.log(`📧 isEmailEnabled: ${enabled}`);
    return enabled;
}

module.exports = { sendMail, isEmailEnabled };
