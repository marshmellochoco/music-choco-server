require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const PORT = 8001;
const app = express();
app.use(cors());

const audioConn = mongoose.createConnection(process.env.AUDIO_URI);
audioConn.once("open", () => {
    console.log("Connected to MongoDB Audio");
    app.listen(PORT, () => {
        console.log("Listening at " + process.env.PLAY_URL);
    });

    app.get("/track/:id/", async (req, res) => {
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

    // #region temp
    // app.use(userAuth);
    // //#region Upload Track
    // // const fs = require("fs");
    // // app.get("/init", (req, res) => {
    // //     const fileName = "61b63c6ae0c844376a66b4c2";
    // //     const filePath = "./track/ksk.mp3";
    // //     const db = audioConn.db;
    // //     const bucket = new mongoose.mongo.GridFSBucket(db);
    // //     const videoUploadStream = bucket.openUploadStream(fileName);
    // //     const videoReadStream = fs.createReadStream(filePath);
    // //     videoReadStream.pipe(videoUploadStream);
    // //     res.status(200).send("done");
    // //     console.log("ok");
    // // });
    // //#endregion

    // //#region Temp Queries
    // app.get("/featured-artists", async (req, res) => {
    //     res.send(await getFeaturedArtists());
    // });

    // app.get("/new-release", async (req, res) => {
    //     res.send(await getNewRelease());
    // });
    // //#endregion

    // //#region Artist
    // app.get("/artist/:id", async (req, res) => {
    //     if (!mongoose.isValidObjectId(req.params.id)) {
    //         res.sendStatus(400);
    //         return;
    //     }
    //     let artist = await getArtistById(req.params.id);
    //     res.send(artist);
    // });

    // app.get("/artist/:id/albums", async (req, res) => {
    //     if (!mongoose.isValidObjectId(req.params.id)) {
    //         res.sendStatus(400);
    //         return;
    //     }
    //     let albums = await getArtistAlbums(req.params.id);
    //     res.send(albums);
    // });

    // app.get("/artist/:id/tracks", async (req, res) => {
    //     if (!mongoose.isValidObjectId(req.params.id)) {
    //         res.sendStatus(400);
    //         return;
    //     }
    //     let tracks = await getArtistTracks(req.params.id);
    //     res.send(tracks);
    // });
    // //#endregion

    // //#region Album
    // app.get("/album/:id", async (req, res) => {
    //     if (!mongoose.isValidObjectId(req.params.id)) {
    //         res.sendStatus(400);
    //         return;
    //     }
    //     let album = await getAlbumById(req.params.id);
    //     res.send(album);
    // });

    // app.get("/album/:id/tracks", async (req, res) => {
    //     if (!mongoose.isValidObjectId(req.params.id)) {
    //         res.sendStatus(400);
    //         return;
    //     }
    //     let tracks = await getAlbumTracks(req.params.id);
    //     res.send(tracks);
    // });
    // //#endregion

    // //#region Playlist
    // app.post("/playlist", async (req, res) => {
    //     let playlist = await addPlaylist({ ...req.body, creator: req.user });
    //     res.send(playlist);
    // });

    // app.get("/playlist/:id", async (req, res) => {
    //     if (!mongoose.isValidObjectId(req.params.id)) {
    //         res.sendStatus(400);
    //         return;
    //     }
    //     let playlist = await getPlaylistById(req.params.id);
    //     res.send(playlist);
    // });

    // app.get("/playlist/:id/tracks", async (req, res) => {
    //     if (!mongoose.isValidObjectId(req.params.id)) {
    //         res.sendStatus(400);
    //         return;
    //     }

    //     let tracks = await getPlaylistTracks(req.params.id);
    //     res.send(tracks);
    // });

    // app.put("/playlist/:id", async (req, res) => {
    //     if (!mongoose.isValidObjectId(req.params.id)) {
    //         res.sendStatus(400);
    //         return;
    //     }

    //     let playlist = await updatePlaylist(req.params.id, req.body);
    //     res.send(playlist);
    // });

    // app.delete("/playlist/:id", async (req, res) => {
    //     if (!mongoose.isValidObjectId(req.params.id)) {
    //         res.sendStatus(400);
    //         return;
    //     }

    //     let playlist = await deletePlaylist(req.params.id);
    //     res.send(playlist);
    // });
    // //#endregion

    // //#region Library
    // app.get("/library/playlist", async (req, res) => {
    //     res.send(await getUserLibraryPlaylist(req.user));
    // });

    // app.get("/library/artist", async (req, res) => {
    //     res.send(await getUserLibraryArtist(req.user));
    // });

    // app.get("/library/album", async (req, res) => {
    //     res.send(await getUserLibraryAlbum(req.user));
    // });

    // app.put("/library/playlist", async (req, res) => {
    //     res.send(await setUserLibraryPlaylist(req.user, req.body));
    // });

    // app.put("/library/artist", async (req, res) => {
    //     res.send(await setUserLibraryArtist(req.user, req.body));
    // });

    // app.put("/library/album", async (req, res) => {
    //     res.send(await setUserLibraryAlbum(req.user, req.body));
    // });
    // //#endregion

    // //#region Search
    // app.get("/search/:query", async (req, res) => {
    //     let artists = await searchArtist(req.params.query);
    //     let albums = await searchAlbum(req.params.query);
    //     let tracks = await searchTrack(req.params.query);
    //     res.send({ artists, albums, tracks });
    // });
    // //#endregion
    // #endregion
});
