const User = require('../models/user.model');
const Event = require('../models/event.model');
const notificationService = require('../services/notification.service');

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
        console.log(`[Automation Engine] Waking up. Initiating dispatch for UTC Hour: ${currentUtcHour}`);

        res.status(200).json({
            success: true,
            message: `Digest dispatch initiated successfully for UTC Hour ${currentUtcHour}. Processing in background.`
        });

        const cursor = User.find({"notificationChannels.notificationUtcHour": currentUtcHour}).cursor();
        const now = new Date();

        for await (const user of cursor){
            try{
                if(!user.notificationChannels || user.notificationChannels.length === 0){
                    continue;
                }
                if(!user.subscriptions || user.subscriptions.length === 0){
                    continue;
                }

                const dueChannels = user.notificationChannels.filter(
                    ch => ch.notificationUtcHour === currentUtcHour
                );

                if(dueChannels.length === 0) continue;

                const activeEvents = await Event.find({
                    _id: {$in: user.subscriptions},
                    endTime: {$gte: now}
                });

                if (activeEvents.length === 0){
                    continue;
                }

                const eventListString = activeEvents.map(event => {
                    const msRemaining = event.endTime - now;
                    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

                    return `• ${event.eventName}: ${daysRemaining} day(s) remaining`;
                }).join('\n');

                const message = `Hello ${user.name},\n\nYou have ${activeEvents.length} active event(s) you are tracking:\n\n${eventListString}\n\nLog in to your dashboard for more details.`;

                for (const channel of dueChannels){
                    try{
                        await notificationService.sendNotification({
                            channelType: channel.channelType,
                            target: channel.target,
                            subject: "Your Event Digest Notification",
                            message
                        });
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