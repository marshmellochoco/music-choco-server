const mongoose = require("mongoose");
const { Song } = require("./song");
const Schema = mongoose.Schema;

const albumSchema = new Schema({
    albumname: {
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
    songs: [Song.schema],
});

const Album = mongoose.model("Album", albumSchema);

module.exports = { Album };
