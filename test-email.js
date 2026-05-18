#!/usr/bin/env node
/**
 * Проверка SMTP: скопируйте .env.example → .env, задайте SMTP_* и EMAIL_ENABLED=true
 * node scripts/test-email.js [email@example.com]
 */
require('dotenv').config();
const { sendMail, isEmailEnabled, verifySmtpConnection } = require('../services/mail');

const to = process.argv[2] || process.env.SMTP_USER;

async function main() {
    console.log('EMAIL_ENABLED:', isEmailEnabled());
    if (!isEmailEnabled()) {
        console.error('Установите EMAIL_ENABLED=true в .env');
        process.exit(1);
    }

    const verify = await verifySmtpConnection();
    if (!verify.ok) {
        console.error('SMTP:', verify.message);
        process.exit(1);
    }
    console.log('SMTP: подключение OK');

    const result = await sendMail({
        to,
        subject: 'Тест: система замены преподавателей',
        html: '<p>Если вы видите это письмо, почта настроена верно.</p>'
    });

    console.log(result);
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
