// ---------- Models ----------
const { Album } = require("../_models/albums");

// ---------- Dependancies ----------
const { ObjectID } = require("bson");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

// ---------- Functions ----------
async function getAudioFile(songid) {
    if (!ObjectID.isValid(songid)) throw "Invalid song id";
    var pathToSong = "";
    await Album.findOne({ "songs._id": songid })
        .then((response) => {
            pathToSong = `./Song/${response._id}/${songid}.mp3`;
        })
        .catch((err) => {
            throw err;
        });
    return pathToSong;
}

function streamAudio(pipe, pathToSong) {
    // Music streaming ow yeaaa
    var proc = ffmpeg(pathToSong)
        .toFormat("wav")
        .on("end", function () {})
        .on("error", function (err) {})
        // save to stream
        .pipe(pipe, { end: true });
    return proc;
}

module.exports = {
    getAudioFile,
    streamAudio,
};
