const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth:{
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
});

async function sendEmail({ to, subject, text }) {
    return await transporter.sendMail({
        from: `"Event Tracker" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text
    });
}

async function sendTelegram({ chatId, text }) {
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text })
    });

    const data = await response.json();
    if (!data.ok) {
        throw new Error(`Telegram API Error: ${data.description}`);
    }
    return data;
}

async function sendDiscord({ target, text }) {
    //Discord Webhook URL
    if (target.startsWith('http')) {
        const response = await fetch(target, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text })
        });
        if (!response.ok) {
            throw new Error(`Discord Webhook failed with status: ${response.status}`);
        }
        return true;
    } 

    //Discord Direct Message via Bot
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const dmRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipient_id: target })
    });
    const dmChannel = await dmRes.json();

    if (!dmChannel.id) {
        throw new Error("Could not create Discord DM channel with provided User ID.");
    }

    const msgRes = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: text })
    });

    if (!msgRes.ok) {
        throw new Error(`Discord DM failed with status: ${msgRes.status}`);
    }
    return true;
}

async function sendNotification({ channelType, target, subject, message }) {
    switch (channelType) {
        case 'email':
            return await sendEmail({ to: target, subject: subject || "Event Notification", text: message });
        case 'telegram':
            return await sendTelegram({ chatId: target, text: message });
        case 'discord':
            return await sendDiscord({ target, text: message });
        default:
            throw new Error(`Unsupported notification channel type: ${channelType}`);
    }
}

module.exports = {
    sendEmail,
    sendTelegram,
    sendDiscord,
    sendNotification
}