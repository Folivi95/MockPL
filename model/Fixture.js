const mongoose = require('mongoose');

const fixtureSchema = new mongoose.Schema({
    homeTeam: {
        type: String,
        required: true,
        min: 3,
        max: 255
    },
    awayTeam: {
        type: String,
        required: true,
        min: 3,
        max: 255
    },
    homeScore: {
        type: String,
        required: true,
    },
    awayScore: {
        type: String,
        required: true,
    },
    matchDay: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    }
}, {collection: 'MPLFixtures'});

module.exports = mongoose.model('Fixture', fixtureSchema);