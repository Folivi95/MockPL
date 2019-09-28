const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    email: {
        type: String,
        required: true,
        min: 6,
        max: 255
    },
    password: {
        type: String,
        required: true,
        min: 6,
        max: 1024
    },
    adminFlag: {
        type: Boolean,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {collection: 'MPLUsers'});

module.exports = mongoose.model('User', userSchema);