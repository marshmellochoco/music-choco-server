const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const songSchema = new Schema({
    duration: {
        type: Number,
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    songDoc: {
        type: String,
        requires: true,
    },
});

const Song = mongoose.model("Song", songSchema);
module.exports = { Song };
