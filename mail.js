const nodemailer = require('nodemailer');

let transporter = null;

function isEmailEnabled() {
    const flag = String(process.env.EMAIL_ENABLED || 'false').toLowerCase();
    return flag === 'true' || flag === '1';
}

function getMailFrom() {
    return process.env.MAIL_FROM || process.env.SMTP_USER || 'noreply@university.ru';
}

function getTransporter() {
    if (transporter) return transporter;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    const secureEnv = process.env.SMTP_SECURE;
    const secure = secureEnv != null
        ? ['true', '1', 'yes'].includes(String(secureEnv).toLowerCase())
        : port === 465;

    transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass }
    });

    return transporter;
}

/**
 * @param {{ to: string, subject: string, html: string, text?: string }} options
 * @returns {Promise<{ sent: boolean, skipped?: boolean, reason?: string }>}
 */
async function sendMail({ to, subject, html, text }) {
    if (!isEmailEnabled()) {
        return { sent: false, skipped: true, reason: 'EMAIL_ENABLED=false' };
    }

    if (!to) {
        return { sent: false, skipped: true, reason: 'no recipient' };
    }

    const transport = getTransporter();
    if (!transport) {
        console.warn('📧 Почта: не заданы SMTP_HOST / SMTP_USER / SMTP_PASS');
        return { sent: false, skipped: true, reason: 'smtp not configured' };
    }

    await transport.sendMail({
        from: getMailFrom(),
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    });

    console.log(`📧 Письмо отправлено: "${subject}" → ${to}`);
    return { sent: true };
}

async function verifySmtpConnection() {
    if (!isEmailEnabled()) return { ok: false, message: 'EMAIL_ENABLED=false' };
    const transport = getTransporter();
    if (!transport) return { ok: false, message: 'SMTP not configured' };
    await transport.verify();
    return { ok: true };
}

module.exports = {
    sendMail,
    isEmailEnabled,
    getMailFrom,
    verifySmtpConnection
};
