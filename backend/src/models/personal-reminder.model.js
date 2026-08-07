const mongoose = require('mongoose');

const personalReminderSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    customName:{
        type:String,
        index: true,
        required: true,
        maxLength: [100, "Max length 100"]
    },
    notes:{
        type: String,
        maxLength: [500, "Max length 500"]
    },
    endTime:{
        type: Date,
        required: true
    }
},{timestamps: true});

personalReminderSchema.pre('save', function(next) {
    if(this.isNew || this.isModified('endTime')){
        if(this.endTime < new Date()) {
            return next(new Error("Validation Error: Event end time must occur in future."));
        }
    }
    next();
});

const PersonalReminder = mongoose.model("PersonalReminder", personalReminderSchema);

module.exports = PersonalReminder;