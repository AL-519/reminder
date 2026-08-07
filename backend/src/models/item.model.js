const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    categoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Category",
        required: true,
        index: true
    },
    slug:{
        type: String,
        index: true,
        required: true,
        lowercase: true,
        trim: true,
        unique: true
    },
    displayName:{
        type: String,
        index: true,
        required: true,
        trim: true
    },
    thumbnailImage:{
        type: String,
        required: true,
        trim: true
    }
},{timestamps: true});

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;