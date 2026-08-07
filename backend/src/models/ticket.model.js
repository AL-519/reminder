const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    issueDescription:{
        type: String,
        required: true,
        maxLength: 200
    },
    attachedAssetType:{
        type: String,
        required: function() {return !!this.attachedAssetId;},
        enum: ['Event', 'PersonalReminder']
    },
    attachedAssetId:{
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'attachedAssetType'
    },
    occurrenceTime:{
        type: Date,
        required: true,
    },
    status:{
        type: String,
        required: true,
        enum: ['open', 'in-progress', 'resolved', 'closed'],
        default: 'open',
        index: true
    }
},{timestamps: true});

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;