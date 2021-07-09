const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const playlistSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    list: {
        type: Array,
        required: true,
    },
});

const Playlist = mongoose.model("Playlist", playlistSchema);

module.exports = { Playlist };
