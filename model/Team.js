const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({

}, {collection: 'MPLTeams'});

module.exports = mongoose.model('Team', teamSchema);