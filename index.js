// ---------- Dependencies ----------
const fs = require("fs");
const { ObjectID, ObjectId } = require("bson");
const mm = require("music-metadata");

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 4000;

// ---------- Express app initialization ----------
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------- Database ----------
const { Song, Album } = require("./_models/albums");
const mongoose = require("mongoose");
const { authenticateToken, upload, getUser } = require("./util");
const { User } = require("./_models/user");
const { authRouter } = require("./routes/authRouter");
const { albumRouter } = require("./routes/albumRouter");
const { userRouter } = require("./routes/userRouter");

mongoose
    .connect(process.env.URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
    })
    .then(() => {
        console.log("Connected to MongoDB");
        app.listen(port, () => {
            console.log("Listening at http://localhost:" + port);
        });
    });

const conn = mongoose.createConnection(process.env.SONG_URI);

conn.once("open", function () {
    var gfs = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: "song" });

    // ---------- Routers ----------
    const songRouter = require("express").Router();
    songRouter.post(
        "/",
        authenticateToken,
        upload.single("file"),
        async (req, res) => {
            const readStream = gfs.openDownloadStream(req.file.id);
            const writeStream = fs.createWriteStream(
                `./temp/${req.file.id}.mp3`
            );

            // Download file to local
            await readStream.pipe(writeStream).once("finish", async () =>
                mm
                    // Upload file to database server
                    .parseFile(`./temp/${req.file.id}.mp3`, {
                        duration: true,
                    })
                    .then((metadata) => {
                        // Delete local file once file is uploaded
                        fs.unlink(`./temp/${req.file.id}.mp3`, (err) => {
                            if (err) throw err;
                        });

                        const songDoc = new Song({
                            duration: Math.floor(metadata.format.duration),
                            title: metadata.common.title,
                            songDoc: req.file.id,
                        });

                        // Create a new Album object in database
                        Album.updateOne(
                            { _id: ObjectId(req.body.albumID) },
                            { $push: { songs: songDoc } }
                        )
                            .then((result) => res.send(result))
                            .catch((err) => res.status(400).send(err));
                    })
            );
        }
    );

    songRouter.route("/play/:songid").get(async (req, res) => {
        if (!ObjectID.isValid(req.params.songid)) {
            res.status(400).send("Invalid song ID.");
            return;
        }
        // Find if any song in album matches songid
        await Album.aggregate([
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
            .then((result) => {
                if (result.length <= 0) {
                    res.status(404).send("Song not found.");
                    return;
                }

                // Stream the song from database server to client
                const readStream = gfs.openDownloadStream(
                    ObjectId(result[0].songs.songDoc)
                );
                readStream.pipe(res, { end: true });
            })
            .catch((err) => res.status(400).send("Unknown error: " + err));
    });

    songRouter.route("/search/:string").get(async (req, res) => {
        // return a list of songs that its title contains the string
        if (req.params.string == "undefined" || req.params.string == "") {
            res.status(400).send("Invalid query string");
            return;
        }
        await Album.aggregate([
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
        ])
            .then((result) => res.send(result))
            .catch((err) => res.status(400).send("Unknown error: " + err));
    });

    songRouter
        .route("/:songid")
        .get(async (req, res) => {
            if (!ObjectID.isValid(req.params.songid)) {
                res.status(400).send("Invalid song id.");
                return;
            }
            await Album.aggregate([
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
                .catch((err) => res.status(400).send("Unknown error: " + err));
        })
        .delete((req, res) => {
            Album.aggregate([
                {
                    $match: {
                        "songs._id": ObjectId(req.params.songid),
                    },
                },
                {
                    $unwind: "$songs",
                },
                {
                    $match: {
                        "songs._id": ObjectId(req.params.songid),
                    },
                },
                {
                    $limit: 1,
                },
            ]).then(async (result) => {
                Album.updateOne(
                    { _id: ObjectId(result[0]._id) },
                    { $pull: { songs: { _id: ObjectId(req.params.songid) } } }
                ).catch((err) => res.status(400).send("Unknown error: " + err));

                gfs.delete(ObjectId(result[0].songs.songDoc), (err) => {
                    if (err) res.status(400).send("Unknown error: " + err);
                    else res.send(result);
                });
            });
        });

    // ---------- API Routes ----------
    app.get("/api", (req, res) => res.send("ok"));
    app.use("/api/album", albumRouter);
    app.use("/api/auth", authRouter);
    app.use("/api/song", songRouter);
    app.use("/api/user", userRouter);
});

// TODO: Gotta tidy this up...
