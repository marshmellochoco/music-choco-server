require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const {
    getArtistById,
    getArtistAlbums,
    getAlbumById,
    getAlbumTracks,
    getFeaturedArtists,
    getNewRelease,
    getArtistTracks,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addPlaylist,
    userAuth,
    loginUser,
    registerUser,
    getUserPlaylist,
    setUserFavArtist,
    setUserFavAlbum,
    getUserFavArtist,
    getUserFavAlbum,
    getPlaylistTracks,
} = require("./query");
const PORT = 8000;
const app = express();
app.use(cors());
app.use(bodyParser.json());

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
    //     const fileName = "61b63c6ae0c844376a66b4c2";
    //     const filePath = "./track/ksk.mp3";
    //     const db = audioConn.db;
    //     const bucket = new mongoose.mongo.GridFSBucket(db);
    //     const videoUploadStream = bucket.openUploadStream(fileName);
    //     const videoReadStream = fs.createReadStream(filePath);
    //     videoReadStream.pipe(videoUploadStream);
    //     res.status(200).send("done");
    //     console.log("ok");
    // });
    //#endregion

    app.get("/featured-artists", async (req, res) => {
        res.send(await getFeaturedArtists());
    });

    app.get("/new-release", async (req, res) => {
        res.send(await getNewRelease());
    });

    //#region Artist
    app.get("/artist/:id", async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.sendStatus(400);
            return;
        }
        let artist = await getArtistById(req.params.id);
        res.send(artist);
    });

    app.get("/artist/:id/albums", async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.sendStatus(400);
            return;
        }
        let albums = await getArtistAlbums(req.params.id);
        res.send(albums);
    });

    app.get("/artist/:id/tracks", async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.sendStatus(400);
            return;
        }
        let tracks = await getArtistTracks(req.params.id);
        res.send(tracks);
    });
    //#endregion

    //#region Album
    app.get("/album/:id", async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.sendStatus(400);
            return;
        }
        let album = await getAlbumById(req.params.id);
        res.send(album);
    });

    app.get("/album/:id/tracks", async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.sendStatus(400);
            return;
        }
        let tracks = await getAlbumTracks(req.params.id);
        res.send(tracks);
    });
    //#endregion

    //#region Track
    app.get("/track/:id/play", async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.sendStatus(400);
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
    //#endregion

    //#region Playlist
    app.post("/playlist", userAuth, async (req, res) => {
        let playlist = await addPlaylist({ ...req.body, creator: req.user });
        res.send(playlist);
    });

    app.get("/playlist/:id", async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.sendStatus(400);
            return;
        }
        let playlist = await getPlaylistById(req.params.id);
        res.send(playlist);
    });

    app.get("/playlist/:id/tracks", async (req, res) => {
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.sendStatus(400);
            return;
        }

        let tracks = await getPlaylistTracks(req.params.id);
        res.send(tracks);
    });

    app.put("/playlist/:id", userAuth, async (req, res) => {
        // TODO: Auth user before update
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.sendStatus(400);
            return;
        }

        let playlist = await updatePlaylist(req.params.id, req.body.playlist);
        res.send(playlist);
    });

    app.delete("/playlist/:id", userAuth, async (req, res) => {
        // TODO: Auth user before delete
        if (!mongoose.isValidObjectId(req.params.id)) {
            res.sendStatus(400);
            return;
        }

        let playlist = await deletePlaylist(req.params.id);
        res.send(playlist);
    });
    //#endregion

    //#region Library
    app.get("/library/playlist", userAuth, async (req, res) => {
        res.send(await getUserPlaylist(req.user));
    });

    app.get("/library/artist", userAuth, async (req, res) => {
        res.send(await getUserFavArtist(req.user));
    });

    app.get("/library/album", userAuth, async (req, res) => {
        res.send(await getUserFavAlbum(req.user));
    });

    app.put("/library/artist", userAuth, async (req, res) => {
        res.send(await setUserFavArtist(req.user, req.body));
    });

    app.put("/library/album", userAuth, async (req, res) => {
        res.send(await setUserFavAlbum(req.user, req.body));
    });
    //#endregion

    //#region Authentication
    app.post("/login", async (req, res) => {
        let token = await loginUser(req.body.credential);
        if (!token.error) res.send({ token });
        else res.sendStatus(token.error);
    });

    app.post("/register", async (req, res) => {
        let token = await registerUser(req.body.credential);
        if (!token.error) res.send({ token });
        else res.sendStatus(token.error);
    });
    //#endregion
});
