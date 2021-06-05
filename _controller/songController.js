// ---------- Models ---------
const { Song, Album } = require("../_models/albums");

// ---------- Dependencies ---------
const fs = require("fs");
const getMP3Duration = require("get-mp3-duration");
const uuid = require("uuid");
const path = require("path");
const multer = require("multer");
const { ObjectID, ObjectId } = require("bson");

// ---------- Functions ----------
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

function getSongDuration(song) {
    const buffer = fs.readFileSync(`./Song/${song}`);
    const duration = getMP3Duration(buffer) / 1000;
    return Math.floor(duration);
}

module.exports = {
    searchSong,
    getSong,
    addSong,
};
