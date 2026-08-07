const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    slug:{
        type: String,
        index: true,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    displayName:{
        type: String,
        index: true,
        required: true,
        trim: true
    },
    backgroundImage:{
        type: String,
        required: true,
        trim: true
    }
},{timestamps: true});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;