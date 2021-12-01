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

const playlistSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
    },
    creator: {
        type: [Schema.Types.ObjectId],
        ref: User,
        required: true,
    },
    createdAt: {
        type: Date,
        required: true,
    },
});
const Playlist = mongoose.model("Playlist", playlistSchema);

const userSchema = new Schema({
    hash: {
        type: String,
        required: true,
    },
    displayName: {
        type: String,
        required: true,
        default: "User",
    },
    image: {
        type: String,
        required: true,
        default: "",
    },
    type: {
        type: String,
        required: true,
    },
    playlist: {
        type: [Schema.Types.ObjectId],
        ref: Playlist,
        default: [],
        // TODO: Add queue playlist as default
    },
    favouraiteArtist: {
        type: [Schema.Types.ObjectId],
        ref: Artist,
        default: [],
    },
    favouraiteAlbum: {
        type: [Schema.Types.ObjectId],
        ref: Album,
        default: [],
    },
});
const User = mongoose.model("User", userSchema);

module.exports = { Artist, Album, Track, Playlist, User };
