const mongoose = require('mongoose');
require('dotenv').config();

/**
 * -------------- DATABASE ----------------
 */

 // Connection with Moongoose to the server
 
const connection = mongoose.createConnection(process.env.DND_DB, {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
});

// Creates simple schema for a User.  The hash and salt are derived from the user's given password when they register

const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    hash: String,
    salt: String,
    campaigns: [{
        name: String,
        description: String,
        maps: [],
        date: Date,
        time: String,
    }],
    characters: [],
});


const mapSchema = new mongoose.Schema({
    mapName: String,
    mapImg: Buffer,
    mimeType: String,
});

const campaignSchema = new mongoose.Schema({
    campaign: String,
    description: String,
    maps: [],
    dm_notes: [],
    player_notes:[],
    mapNotes: [],
    mapBO: [],
    players: [],
})

const Maps = connection.model('Maps', mapSchema);
const User = connection.model('User', userSchema);
const Campaign = connection.model('Campaign', campaignSchema);

// Expose the connection
module.exports = connection;