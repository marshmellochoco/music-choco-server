const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const artistSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: "",
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
        default: "",
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

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    displayName: {
        type: String,
        default: "Anonymous User",
    },
    image: {
        type: String,
        default: "",
    },
    type: {
        type: String,
        required: true,
    },
    likedArtist: {
        type: [Schema.Types.ObjectId],
        ref: Artist,
        default: [],
    },
    likedAlbum: {
        type: [Schema.Types.ObjectId],
        ref: Album,
        default: [],
    },
});
const User = mongoose.model("User", userSchema);

const playlistSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        image: {
            type: String,
            default: "",
        },
        tracks: [
            {
                type: [Schema.Types.ObjectId],
                ref: Track,
            },
        ],
        creator: {
            type: Schema.Types.ObjectId,
            ref: User,
            required: true,
        },
    },
    { timestamps: true }
);
const Playlist = mongoose.model("Playlist", playlistSchema);

module.exports = { Artist, Album, Track, Playlist, User };
