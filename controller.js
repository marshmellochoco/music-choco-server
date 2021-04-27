const Song = require("./models/songs");
const Album = require("./models/albums");

const fs = require("fs");
const getMP3Duration = require("get-mp3-duration");

function getSongData(req, res) {
    // To get song data from database then return the data in json back to client
    var pathToSong = "./Song/" + req.params.songid + ".mp3";
    // Returns the information (metadata) about the song
    const buffer = fs.readFileSync(pathToSong);
    const duration = getMP3Duration(buffer) / 1000;
    res.send({
        duration: duration,
    });
}

const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

function streamAudio(req, res) {
    // Music streaming ow yeaaa
    res.contentType("mp3");
    var pathToSong = "./Song/" + req.params.songid + ".mp3";
    var proc = ffmpeg(pathToSong)
        .toFormat("mp3")
        .on("end", function () {})
        .on("error", function (err) {
            console.log("an error happened: " + err.message);
        })
        // save to stream
        .pipe(res, { end: true });
}

module.exports = { streamAudio, getSongData };
