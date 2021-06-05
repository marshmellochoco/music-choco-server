// ---------- Models ---------
const { Album } = require("../_models/albums");

// ---------- Dependancies ----------
const fs = require("fs");
const uuid = require("uuid");
const path = require("path");
const Jimp = require("jimp");
const multer = require("multer");

// ---------- Functions ----------
async function addAlbum(req, res) {
    let allowed = [".png", ".jpeg", ".jpg", ".bmp", ".tiff"];
    let filename = uuid.v4();
    let storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, "../Song"));
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
    let pathToImg = path.resolve(__dirname, `../Song/${albumid}/ico.jpg`);
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

module.exports = {
    getAlbum,
    getAlbumIcon,
    addAlbum,
    getAlbumList,
    searchAlbum,
};
