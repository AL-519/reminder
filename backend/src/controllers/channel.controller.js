const User = require('../models/user.model');
const pendingVerification = require('../models/pending-verification.model');

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

async function dispatchOTP(channelType, target, otpCode){
    if(channelType === 'email'){
        console.log(`[Email Service] Sending OTP ${otpCode} to ${target}`);
    }
    else if(channelType === 'discord'){
        console.log(`[Discord Webhook] Firing OTP ${otpCode} to webhook: ${target}`);
    }
    else if(channelType === 'telegram'){
        console.log(`[Telegram Bot] Sending OTP ${otpCode} to handle/chat: ${target}`);
    }
}

async function requestChannelVerification(req, res, next){
    try{
        const {channelType, target} = req.body;
        const userId = req.user.id;

        if(!channelType || !target){
            return res.status(400).json({
                success: false,
                message: "Channel type and target address/URL are required."
            });
        }

        if(!['email', 'discord', 'telegram'].includes(channelType)){
            return res.status(400).json({
                success: false,
                message: "Invalid channel type provided."
            });
        }

        const user = await User.findById(userId);
        const isAlreadyVerified = user.notificationChannels.some(
            ch => ch.channelType === channelType && ch.target === target.trim()
        );

        if(isAlreadyVerified){
            return res.status(409).json({
                success: false,
                message: "This notification channel is already verified and active."
            });
        }

        await pendingVerification.deleteMany({userId, channelType});

        const otpCode = generateOTP();
        await pendingVerification.create({
            userId,
            channelType,
            target: target.trim(),
            otpCode
        });

        await dispatchOTP(channelType, target.trim(), otpCode);
        
        return res.status(200).json({
            success: true,
            message: `Verification code sent to your ${channelType}. Code expires in 15 minutes.`
        });
    }
    catch(err){
        next(err);
    }
}

async function confirmChannelVerification(req, res, next){
    try{
        const {channelType, target, otpCode} = req.body;
        const userId = req.user.id;

        if(!channelType || !target || !otpCode){
            return res.status(400).json({
                success: false,
                message: "Channel type, target, and 6-digit OTP code are required."
            });
        }

        const pendingRecord = await pendingVerification.findOne({
            userId,
            channelType,
            target: target.trim(),
            otpCode: otpCode.trim()
        });

        if(!pendingRecord){
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification OTP code."
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $addToSet:{
                    notificationChannels: {
                        channelType,
                        target: target.trim()
                    }
                }
            },
            {new: true}
        );

        await pendingVerification.findByIdAndDelete(pendingRecord._id);

        return res.status(200).json({
            success: true,
            message: `${channelType} notification channel verified successfully`,
            data:{
                notificationChannels: updatedUser.notificationChannels
            } 
        });
    }
    catch(err){
        next(err);
    }
}

async function updateNotificationTimezone(req, res, next){
    try{
        const {notificationUtcHour} = req.body;
        const userId = req.user.id;

        if(notificationUtcHour !== null && (!Number.isInteger(notificationUtcHour) || notificationUtcHour < 0 || notificationUtcHour >23)){
            return res.status(400).json({
                success: false,
                message: "Notification UTC hour must be null or an integer between 0 and 23."
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {notificationUtcHour},
            {new: true}
        );

        return res.status(200).json({
            success: true,
            message: "Notification time preferences updated successfully.",
            data:{
                notificationUtcHour: updatedUser.notificationUtcHour
            }
        });
    }
    catch(err){
        next(err);
    }
}

async function removeChannel(req, res, next){
    try{
        const {channelType, target} = req.body;
        const userId = req.user.id;

        if(!channelType || !target){
            return res.status(400).json({
                success: false,
                message: "Channel type and target are required to remove a channel."
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                $pull: {
                    notificationChannels: {channelType, target: target.trim()}
                }
            },
            {new: true}
        );

        return res.status(200).json({
            success: true,
            message: "Notification channel removed successfully.",
            data: {
                notificationChannels: updatedUser.notificationChannels
            }
        });
    }
    catch(err){
        next(err);
    }
}

module.exports = {
    requestChannelVerification,
    confirmChannelVerification,
    updateNotificationTimezone,
    removeChannel
}