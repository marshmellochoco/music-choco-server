const { authenticateToken } = require("../util");
const { Album } = require("../_models/albums");
const uuid = require("uuid").v4;
const multer = require("multer");
const path = require("path");
const Jimp = require("jimp");
const fs = require("fs");

async function addAlbum(req, res) {
    let allowed = [".png", ".jpeg", ".jpg", ".bmp", ".tiff"];
    let filename = uuid();
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

    upload(req, res, function (err) {
        if (err) {
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
                if (response.length > 0) {
                    res.status(400).send("Album already exist.");
                }
                albumDoc.save((err, album) => {
                    if (err) res.send(err);
                    else {
                        Jimp.read(`./Song/${filename}`, (err, img) => {
                            if (err) throw err;
                            img.resize(200, 200)
                                .writeAsync(`./Song/${albumDoc._id}.jpg`)
                                .then(
                                    fs.unlink(`./Song/${filename}`, (err) => {
                                        if (err) throw err;
                                    })
                                );
                        }).then(res.send(album));
                    }
                });
            })
            .catch((err) => {
                res.status(400).send(err);
            });
    });
}

// TODO: Test router
const albumRouter = require("express").Router();
albumRouter.get("/", async (req, res) => {
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
            res.send(albumList);
        })
        .catch((err) => res.status(400).send("Unknown error: " + err));
});

albumRouter.post("/", authenticateToken, (req, res) => addAlbum(req, res));

albumRouter.get("/ico/:albumid", (req, res) => {
    // return the icon file of given album id
    try {
        let pathToImg = path.resolve(
            __dirname,
            `./Song/${req.params.albumid}.jpg`
        );
        let icon = fs.existsSync(pathToImg) ? pathToImg : undefined;
        if (!icon) throw "Invalid album id";
        res.sendFile(icon);
    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
});

albumRouter.get("/search/:string", async (req, res) => {
    if (req.params.string == "undefined" || req.params.string == "") {
        res.status(400).send("Invalid query string");
        return;
    }
    await Album.find({
        albumname: { $regex: req.params.string, $options: "i" },
    })
        .limit(10)
        .then((result) => res.send(result))
        .catch((err) => res.status(400).send("Unknown error: " + err));
});

albumRouter.get("/:albumid", async (req, res) => {
    await Album.findOne({ _id: req.params.albumid })
        .then((album) => res.send(album))
        .catch((err) => res.status(400).send("Unknown error: " + err));
});

module.exports = { albumRouter };
