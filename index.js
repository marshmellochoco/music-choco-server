require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const {
    getArtistById,
    getArtistAlbums,
    getAlbumById,
    getAlbumTracks,
    getTrackById,
    getFeaturedArtists,
    getNewRelease,
    getArtistTracks,
} = require("./query");
const PORT = 8000;
const app = express();
app.use(cors());

mongoose
    .connect(process.env.MONGOBD_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB Data"));

const audioConn = mongoose.createConnection(process.env.AUDIO_URI);
audioConn.once("open", () => {
    console.log("Connected to MongoDB Audio");
    app.listen(PORT, () => {
        console.log("Listening at http://localhost:" + PORT);
    });

    //#region Upload Track
    // const fs = require("fs");
    // app.get("/init", (req, res) => {
    //     const fileName = "61582e4267d0bc1b70d1ae05";
    //     const filePath = "./track/mmy.mp3";
    //     const db = audioConn.db;
    //     const bucket = new mongoose.mongo.GridFSBucket(db);
    //     const videoUploadStream = bucket.openUploadStream(fileName);
    //     const videoReadStream = fs.createReadStream(filePath);
    //     videoReadStream.pipe(videoUploadStream);
    //     res.status(200).send("done");
    //     console.log("ok");
    // });
    //#endregion

    app.get("/artist/:id", async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.status(400).send("Invalid ID");
            return;
        }
        res.send(await getArtistById(req.params.id));
    });

    app.get("/artist/:id/albums", async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.status(400).send("Invalid ID");
            return;
        }
        res.send(await getArtistAlbums(req.params.id));
    });

    app.get("/artist/:id/tracks", async (req, res) => {
        res.send(await getArtistTracks(req.params.id));
    });

    app.get("/album/:id", async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.status(400).send("Invalid ID");
            return;
        }
        let album = await getAlbumById(req.params.id);
        let tracks = await getAlbumTracks(req.params.id);
        res.send({
            ...album,
            tracks,
        });
    });

    app.get("/album/:id/tracks", async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.status(400).send("Invalid ID");
            return;
        }
        res.send(await getAlbumTracks(req.params.id));
    });

    app.get("/track/:id", async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.status(400).send("Invalid ID");
            return;
        }
        res.send(await getTrackById(req.params.id));
    });

    app.get("/track/:id/play", async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.status(400).send("Invalid ID");
            return;
        }

        const db = audioConn.db;
        db.collection("fs.files").findOne(
            { filename: req.params.id },
            (err, audio) => {
                if (err) {
                    console.log(err);
                    return;
                }

                const contentLength = audio.length;
                const start = 0;
                const end = contentLength - 1;

                const headers = {
                    "Content-Range": `bytes ${start}-${end}/${contentLength}`,
                    "Accept-Ranges": "bytes",
                    "Content-Length": contentLength,
                    "Content-Type": "audio/mp3",
                };

                res.writeHead(206, headers);

                const bucket = new mongoose.mongo.GridFSBucket(db);
                const downloadStream = bucket.openDownloadStreamByName(
                    req.params.id,
                    { start }
                );
                downloadStream.pipe(res);
            }
        );
    });

    app.get("/featured-artists", async (req, res) => {
        res.send(await getFeaturedArtists());
    });

    app.get("/new-release", async (req, res) => {
        res.send(await getNewRelease());
    });
});
