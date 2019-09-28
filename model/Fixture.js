const mongoose = require('mongoose');

const fixtureSchema = new mongoose.Schema({

}, {collection: 'MPLFixtures'});

module.exports = mongoose.model('Fixture', fixtureSchema);