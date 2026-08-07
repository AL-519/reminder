const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    itemId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true,
        index: true
    },
    eventName:{
        type: String,
        index: true,
        required: true,
        trim: true
    },
    eventImage:{
        type: String,
        required: true,
        trim: true
    },
    startTime:{
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true, 
        index: true
    },
    externalLinks:[
        {
            displayName:{
                type: String,
                required: true,
                trim: true
            },
            url:{
                type: String,
                required: true,
                trim: true
            }
        }
    ]
},{timestamps: true});

eventSchema.pre('save', function(next) {
    if(this.isNew || this.isModified('startTime') || this.isModified('endTime')){
        if(this.startTime >= this.endTime) {
            return next(new Error("Validation Error: Event end time must occur after start time."));
        }
    }
    
    next();
});

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;