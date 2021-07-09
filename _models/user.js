const mongoose = require("mongoose");
const { Playlist } = require("./playlist");
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        hash: {
            type: String,
            required: true,
        },
        playingSong: {
            type: String,
        },
        playlist: [Playlist.schema],
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = { User };
