const mongoose = require('mongoose');

const pendingVerificationSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    channelType:{
        type: String,
        required: true,
        enum: ['email', 'discord', 'telegram']
    },
    target:{
        type: String,
        required: true,
    },
    otpCode:{
        type: String,
        required: true,
        match: [/^\d{6}$/, 'OTP must be exactly 6 numeric digits.']
    },
    createdAt:{
        type: Date,
        default: Date.now,
        expires: 900
    }
});

const PendingVerification = mongoose.model("PendingVerification", pendingVerificationSchema);

module.exports = PendingVerification;