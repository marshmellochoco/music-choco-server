const { Song, Album } = require("./models/albums");
const { User } = require("./models/user");

const fs = require("fs");
const uuid = require("uuid");
const path = require("path");
const Jimp = require("jimp");
const crypto = require("crypto");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
const getMP3Duration = require("get-mp3-duration");
const { ObjectID, ObjectId } = require("bson");
ffmpeg.setFfmpegPath(ffmpegPath);

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

function streamAudio(res, pathToSong) {
    // Music streaming ow yeaaa
    var proc = ffmpeg(pathToSong)
        .toFormat("wav")
        .on("end", function () {})
        .on("error", function (err) {})
        // save to stream
        .pipe(res, { end: true });
    return proc;
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
                            fs.mkdirSync(`./Song/${albumDoc._id}`);
                            Jimp.read(`./Song/${filename}`, (err, img) => {
                                if (err) throw err;
                                img.resize(200, 200)
                                    .writeAsync(
                                        `./Song/${albumDoc._id}/icon.jpg`
                                    )
                                    .then(
                                        fs.unlink(
                                            `./Song/${filename}`,
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

async function getAlbumList() {
    let albumList = [];
    await Album.find()
        .then((response) => {
            response.map((r) => {
                albumList.push({
                    id: r._id,
                    albumname: r.albumname,
                    artist: r.artist,
                    releaseDate: r.releaseDate,
                });
            });
        })
        .catch((err) => {
            throw err;
        });
    return albumList;
}

function getAlbumIcon(albumid) {
    let pathToImg = path.resolve(__dirname, `Song/${albumid}/ico.jpg`);
    let icon = fs.existsSync(pathToImg) ? pathToImg : undefined;
    if (!icon) throw "Invalid album id";
    return icon;
}

async function searchAlbum(string) {
    if (string == "undefined" || string == "") throw "Invalid query string";
    let albumList;
    await Album.find({
        albumname: { $regex: string, $options: "i" },
    })
        .limit(10)
        .then((result) => (albumList = result));
    return albumList;
}

async function getAlbum(albumid) {
    let album;
    await Album.findOne({ _id: albumid })
        .then((result) => {
            album = result;
        })
        .catch((err) => {
            throw err;
        });
    return album;
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
                    `./Song/${filename}`,
                    `./Song/${req.body.albumID}/${songDoc._id}`,
                    (err) => {
                        if (err) throw err;
                        res.send(songDoc);
                    }
                );
            })
            .catch((err) => res.status(400).send(err));
    });
}

async function getSong(songId) {
    if (!ObjectID.isValid(songId)) throw "Invalid song id";
    let song;
    await Album.aggregate([
        {
            $match: {
                "songs._id": ObjectID(songId),
            },
        },
        {
            $unwind: "$songs",
        },
        {
            $match: {
                "songs._id": ObjectID(songId),
            },
        },
        {
            $limit: 1,
        },
    ])
        .then((result) => {
            song = result[0];
        })
        .catch((err) => {
            throw err;
        });
    return song;
}

async function searchSong(qString) {
    if (qString == "undefined" || qString == "") throw "Invalid query string";
    let songs;
    await Album.aggregate([
        {
            $match: {
                "songs.title": { $regex: qString, $options: "i" },
            },
        },
        {
            $unwind: "$songs",
        },
        {
            $match: {
                "songs.title": { $regex: qString, $options: "i" },
            },
        },
        {
            $limit: 20,
        },
    ]).then((result) => (songs = result));
    return songs;
}

// ---------- Auth ----------
async function generateToken(credentials) {
    let authToken = "";
    await getUser(credentials)
        .then((user) => {
            if (!user) return "";
            authToken = jwt.sign(credentials, process.env.SECRET_TOKEN, {
                expiresIn: "1800s",
            });
        })
        .catch((err) => {
            throw err;
        });
    return authToken;
}

async function addUser(credentials) {
    await getUser(credentials).then((user) => {
        if (user) throw "User already exist";
        const userDoc = new User({
            hash: crypto
                .createHash("sha256")
                .update(JSON.stringify(credentials))
                .digest("hex"),
        });
        userDoc.save((err) => {
            if (err) throw err;
        });
    });
    return credentials;
}

function authenticateToken(req, res, next) {
    const token = req.headers["authorization"];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
    });

    next();
}

// ---------- Util ----------
async function getUser(credentials) {
    let user;
    const authHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(credentials))
        .digest("hex");
    await User.find({ hash: authHash })
        .then((res) => {
            if (res.length != 0) user = res[0];
        })
        .catch((err) => {
            throw err;
        });
    return user;
}

function getSongDuration(song) {
    const buffer = fs.readFileSync(`./Song/${song}`);
    const duration = getMP3Duration(buffer) / 1000;
    return Math.floor(duration);
}

module.exports = {
    getAudioFile,
    streamAudio,
    searchSong,
    getSong,
    addSong,
    getAlbum,
    getAlbumIcon,
    addAlbum,
    getAlbumList,
    searchAlbum,
    authenticateToken,
    generateToken,
    addUser,
};
