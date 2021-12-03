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
    username: String,
    hash: String,
    salt: String,
});


const mapSchema = new mongoose.Schema({
    mapName: String,
    mapImg: Buffer,
});


const Maps = connection.model('Maps', mapSchema);

// Expose the connection
module.exports = connection;