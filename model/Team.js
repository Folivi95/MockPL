const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        min: 3,
        max: 255
    },
    position: {
        type: Number,
        required: true
    }
}, {collection: 'MPLTeams'});

module.exports = mongoose.model('Team', teamSchema);