const User = require('../models/user.model');
const Event = require('../models/event.model');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function dispatchNotification(channel, message){
    const {channelType, target} = channel;

    if(channelType === 'email'){
        await transporter.sendMail({
            from: `"Event Digest" <${process.env.SMTP_USER}>`,
            to: target,
            subject: "Your Event Digest Notification",
            text: message
        });
    }

    else if(channelType === 'telegram'){
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type' : 'application/json'},
            body: JSON.stringify({
                chat_id: target,
                text: message
            })
        });

        const data = await response.json();
        if(!data.ok){
            throw new Error(`Telegram API Error: ${data.description}`);
        }
    }

    else if(channelType === 'discord'){
        if(target.startsWith('http')){ //Webhook url
            const response = await fetch(target, {
                method: 'POST',
                headers: {'Content-Type' : 'application/json'},
                body: JSON.stringify({content: message})
            });
            if(!response.ok){
                throw new Error(`Discord Webhook failed with status: ${response.status}`);
            }
        }

        else{//direct BOT message
            const botToken = process.env.DISCORD_BOT_TOKEN;

            const dmRes = await fetch('https://discord.com/api/v10/users/@me/channels',{
                method: 'POST',
                headers:{
                    'Authorization': `BOT ${botToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({recipient_id: target})
            });
            const dmChabbel = await dmRes.json();

            if(!dmChannel.id){
                throw new Error("Could not create Discord DM channel with provided User ID.");
            }

            const msgRes = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
                method: 'POST',
                headers:{
                    'Authorization': `BOT ${botToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({content: message})
            });

            if(!msgRes.ok){
                throw new Error(`Discord DM failed with status: ${msgRes.status}`);
            }
        }
    }
}

async function dispatchHourlyDigest(req, res){
    try{
        const cronSecret = req.headers['x-cron-secret'];
        if(!cronSecret || cronSecret !== process.env.CRON_SECRET){
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Invalid or missing execution secret."
            });
        }

        const currentUtcHour = new Date().getUTCHours();
        console.log(`[Automation Engine] Waking up. Initating dispatch for UTC Hour: ${currentUtcHour}`);

        res.status(200).json({
            success: true,
            message: `Digest dispatch initiated successfully for UTC Hour ${currentUtcHour}. Processing in background.`
        });

        const cursor = User.find({notificationUtcHour: currentUtcHour}).cursor();
        const now = new Date();

        for await (const user of cursor){
            try{
                if(!user.notificationChannels || user.notificationChannels.length === 0){
                    continue;
                }
                if(!user.subscriptions || user.subscriptions.length === 0){
                    continue;
                }

                const activeEvents = await Event.find({
                    _id: {$in: user.subscriptions},
                    endTime: {$gte: now}
                });

                if (activeEvents.length === 0){
                    continue;
                }

                const eventListString = activeEvents.map(event => {
                    const msRemaining = event.endtime - now;
                    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

                    return `• ${event.eventName}: ${daysRemaining} day(s) remaining`;
                }).join('\n');
                const message = `Hello ${user.name},\n\nYou have ${activeEvents.length} active event(s) you are tracking:\n\n${eventListString}\n\nLog in to your dashboard for more details.`;

                for (const channel of user.notificationChannels){
                    try{
                        await dispatchNotification(channel, message);
                    }
                    catch(channelErr){
                        console.error(`[Dispatch Failure] Target: ${channel.target} | Reason: `, channelErr.message);
                    }
                }
            }
            catch(userErr){
                console.error(`[User Loop Failure] User ID: ${user._id} | Reason: `, userErr.message);
            }
        }
        console.log(`[Automation Engine] Dispatch fully completed for UTC Hour: ${currentUtcHour}`);
    }
    catch(err){
        console.error("Critical Automation Infrastructure Failure: ", err);
    }
}

module.exports = { dispatchHourlyDigest }