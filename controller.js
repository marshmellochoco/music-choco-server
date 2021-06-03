const { Song, Album } = require("./models/albums");

const fs = require("fs");
const uuid = require("uuid");
const path = require("path");
const Jimp = require("jimp");
const multer = require("multer");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
const getMP3Duration = require("get-mp3-duration");
const { ObjectID, ObjectId } = require("bson");
ffmpeg.setFfmpegPath(ffmpegPath);

async function streamAudio(req, res) {
    if (!ObjectID.isValid(req.params.songid)) {
        res.status(400).send(req.params);
        return
    }

    // Music streaming ow yeaaa
    var pathToSong = "";
    res.contentType("mp3");
    await Album.findOne({ "songs._id": req.params.songid })
        .then((response) => {
            pathToSong =
                "./Song/" + response._id + "/" + req.params.songid + ".mp3";
        })
        .catch(res.status(400).send(req.params));
    var proc = ffmpeg(pathToSong)
        .toFormat("wav")
        .on("end", function () {})
        .on("error", function (err) {})
        // save to stream
        .pipe(res, { end: true });
}

// ---------- Albums ----------
async function addAlbum(req, res) {
    let allowed = [".png", ".jpeg", ".jpg", ".bmp", ".tiff"];
    let filename = uuid.v4();
    let storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, "./Song"));
        },
        filename: function (req, file, cb) {
            if (!allowed.includes(path.extname(file.originalname))) {
                res.status(400).send(req.body);
            }
            cb(null, filename + path.extname(file.originalname));
            filename += path.extname(file.originalname);
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
                            Jimp.read("./Song/" + filename, (err, img) => {
                                if (err) throw err;
                                img.resize(200, 200)
                                    .writeAsync(
                                        "./Song/" + albumDoc._id + "/icon.jpg"
                                    )
                                    .then(
                                        fs.unlink(
                                            "./Song/" + filename,
                                            (err) => {
                                                if (err) throw err;
                                            }
                                        )
                                    );
                            }).then(res.send(albumDoc));
                        }
                    });
                } else {
                    res.status(400).send(req.body);
                }
            })
            .catch((err) => {
                res.status(400).send(err);
            });
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
    let allowed = [".mp3"];
    let filename = uuid.v4();
    let storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, "./Song"));
        },
        filename: function (req, file, cb) {
            if (!allowed.includes(path.extname(file.originalname))) {
                res.status(400).send(req.body);
            }
            cb(null, filename);
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
            .catch((err) => res.status(400).send(err));
    });
}

function getSong(req, res) {
    if (ObjectID.isValid(req.params.songid)) {
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
        ])
            .then((result) => res.send(result[0]))
            .catch((err) => res.status(400).send(err));
    } else {
        res.status(400).send(req.params);
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
