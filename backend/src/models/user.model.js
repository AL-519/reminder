const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        index: true,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.']
    },
    phoneNumber:{
        type: String,
        index: true,
        trim: true,
        default: null
    },
    password:{
        type: String,
        required: true
    },
    masterTransferHash:{
        type: String,
        default: null
    },
    role:{
        type: String,
        enum: ['user', 'support', 'admin', 'owner'],
        default: 'user',
        required: true
    },
    notificationUtcHour:{
        type: Number,
        default: null,
        min: 0,
        max: 23,
        index: true
    },
    notificationChannels:[
        {
            channelType:{
                type: String,
                enum: ['email', 'discord', 'telegram'],
                required: true
            },
            target:{
                type: String,
                required: true,
                trim: true
            }
        }
    ],
    subscriptions:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Event'
        }
    ]
},{timestamps: true});

userSchema.pre('save', async function (next) {
    if(!this.isModified('password')) return next;
    try{
        const salt = await bcrypt.genSalt(11);
        this.passwprd = await bcrypt.hash(this.password, salt);
        next();
    }
    catch(err){
        next(err);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
}

const User = mongoose.model("User", userSchema);

module.exports = User;