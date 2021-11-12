const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const artistSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
});
const Artist = mongoose.model("Artist", artistSchema);

const albumSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    releaseDate: {
        type: Date,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    artists: {
        type: [Schema.Types.ObjectId],
        ref: Artist,
    },
    // total number of tracks
});
const Album = mongoose.model("Album", albumSchema);

const trackSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,
        required: true,
    },
    album: {
        type: Schema.Types.ObjectId,
        ref: Album,
        required: true,
    },
    artists: {
        type: [Schema.Types.ObjectId],
        ref: Artist,
        required: true,
    },
    number: {
        type: Number,
        required: true,
    },
});
const Track = mongoose.model("Track", trackSchema);

module.exports = { Artist, Album, Track };
