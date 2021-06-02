const { Song, Album } = require("./models/albums");

const path = require("path");
const fs = require("fs");
const getMP3Duration = require("get-mp3-duration");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
const { ObjectID, ObjectId } = require("bson");
const multer = require("multer");
ffmpeg.setFfmpegPath(ffmpegPath);

async function streamAudio(req, res) {
    // Music streaming ow yeaaa
    var pathToSong = "";
    if (req.params.songid !== "undefined") {
        res.contentType("mp3");
        await Album.findOne({ "songs._id": req.params.songid }).then(
            (response) => {
                pathToSong =
                    "./Song/" + response._id + "/" + req.params.songid + ".mp3";
            }
        );
        var proc = ffmpeg(pathToSong)
            .toFormat("wav")
            .on("end", function () {})
            .on("error", function (err) {})
            // save to stream
            .pipe(res, { end: true });
    } else {
        res.status(404).send("Not found");
    }
}

// ---------- Albums ----------
async function addAlbum(req, res) {
    let filename = "";
    let storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, "./Song"));
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
            filename = file.originalname;
        },
    });

    let upload = multer({
        storage: storage,
        dest: "Song",
    }).single("icon");

    await upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json(err);
        } else if (err) {
            return res.status(500).json(err);
        }

        const albumDoc = new Album({
            albumname: req.body.album,
            artist: req.body.artist,
            releaseDate: Date.parse(req.body.releaseDate),
            songs: [],
        });

        Album.find({
            albumname: req.body.albumName,
            artist: req.body.artist,
            releaseDate: req.body.releaseDate,
        })
            .then((response) => {
                if (response.length == 0) {
                    albumDoc.save((err, album) => {
                        if (err) res.send(err);
                        else {
                            fs.mkdirSync("./Song/" + albumDoc._id);
                            fs.rename(
                                "./Song/" + filename,
                                "./Song/" + albumDoc._id + "/ico.png",
                                (err) => {
                                    if (err) throw err;
                                    res.send(albumDoc);
                                }
                            );
                        }
                    });
                } else {
                    res.status(400).send(
                        "The album is already exist in the system."
                    );
                }
            })
            .catch((err) => res.status(500).send(err));
    });
}

function getAlbum(req, res) {
    Album.findOne({ _id: req.params.albumid })
        .then((result) => {
            res.send(result);
        })
        .catch((err) => res.status(400).send(err));
}

function getAlbumList(req, res) {
    let albumList = [];
    Album.find()
        .then((response) => {
            response.map((r) => {
                albumList.push({
                    id: r._id,
                    albumname: r.albumname,
                    artist: r.artist,
                    releaseDate: r.releaseDate,
                });
            });
            res.send(albumList);
        })
        .catch((err) => res.status(400).send(err));
}

function getAlbumIcon(req, res) {
    let pathToImg = path.resolve(
        __dirname,
        "Song/" + req.params.albumid + "/ico.jpg"
    );

    if (fs.existsSync(pathToImg)) {
        res.sendFile(
            path.resolve(__dirname, "Song/" + req.params.albumid + "/ico.jpg")
        );
    } else {
        res.status(404).send(req.params);
    }
}

function searchAlbum(req, res) {
    if (req.params.string !== "undefined" && req.params.string !== "") {
        Album.find({
            albumname: { $regex: req.params.string, $options: "i" },
        })
            .limit(10)
            .then((result) => res.send(result));
    } else {
        res.status(400).send(req.params);
    }
}

// ---------- Songs ----------
async function addSong(req, res) {
    let filename = "";
    let storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, "./Song"));
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname);
            filename = file.originalname;
        },
    });

    let upload = multer({
        storage: storage,
        dest: "Song",
    }).single("file");

    await upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json(err);
        } else if (err) {
            return res.status(500).json(err);
        }

        const songDoc = new Song({
            duration: getSongDuration(filename),
            title: req.body.songName,
        });

        Album.updateOne(
            { _id: ObjectId(req.body.albumID) },
            { $push: { songs: songDoc } }
        )
            .then((result) => {
                fs.rename(
                    "./Song/" + filename,
                    "./Song/" + req.body.albumID + "/" + songDoc._id,
                    (err) => {
                        if (err) throw err;
                        res.send(songDoc);
                    }
                );
            })
            .catch((err) => res.status(500).send(err));
    });
}

function getSong(req, res) {
    if (req.params.songid !== "undefined") {
        Album.aggregate([
            {
                $match: {
                    "songs._id": ObjectID(req.params.songid),
                },
            },
            {
                $unwind: "$songs",
            },
            {
                $match: {
                    "songs._id": ObjectID(req.params.songid),
                },
            },
            {
                $limit: 1,
            },
        ]).then((result) => res.send(result[0]));
    } else {
        res.status(404).send(req.params);
    }
}

function searchSong(req, res) {
    if (req.params.string !== "undefined" && req.params.string !== "") {
        Album.aggregate([
            {
                $match: {
                    "songs.title": { $regex: req.params.string, $options: "i" },
                },
            },
            {
                $unwind: "$songs",
            },
            {
                $match: {
                    "songs.title": { $regex: req.params.string, $options: "i" },
                },
            },
            {
                $limit: 20,
            },
        ]).then((result) => res.send(result));
    } else {
        res.status(404).send("Not found");
    }
}

function getSongDuration(song) {
    const buffer = fs.readFileSync("./Song/" + song);
    const duration = getMP3Duration(buffer) / 1000;
    return Math.floor(duration);
}

module.exports = {
    streamAudio,

    addAlbum,
    getAlbum,
    getAlbumList,
    getAlbumIcon,
    searchAlbum,

    addSong,
    getSong,
    searchSong,
};
