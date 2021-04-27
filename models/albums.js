const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const albumSchema = new Schema({
    albumid: {
        type: String,
        required: true,
    },
    artist: {
        type: String,
        required: true,
    },
    releaseDate: {
        type: Date,
    },
    songs: [songSchema],
});

const Album = mongoose.model("Album", albumSchema);

module.exports = Album;