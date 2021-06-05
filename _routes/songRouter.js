const express = require("express");

const { authenticateToken } = require("../_controller/authController");
const {
    searchSong,
    getSong,
    addSong,
} = require("../_controller/songController");
const {
    getAudioFile,
    streamAudio,
} = require("../_controller/streamController");

const songRouter = express.Router();
songRouter.route("/").post(authenticateToken, (req, res) => addSong(req, res));

songRouter.route("/play/:songid").get((req, res) => {
    // get the audio file then pipe it to the response
    getAudioFile(req.params.songid).then((path) => {
        streamAudio(res, path);
    });
});

songRouter.route("/search/:string").get((req, res) => {
    // return a list of songs that its title contains the string
    searchSong(req.params.string)
        .then((result) => {
            res.send(result);
        })
        .catch((err) => res.status(400).send(err));
});

songRouter.route("/:songid").get((req, res) => {
    // return the song with the given song id
    getSong(req.params.songid)
        .then((result) => res.send(result))
        .catch((err) => res.status(400).send(err));
});

module.exports = { songRouter };
