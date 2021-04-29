// Import Dependancies
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Import Controllers
const {
    streamAudio,

    addAlbum,
    getAlbum,
    getAlbumList,
    getAlbumIcon,

    addSong,
    getSongData,
} = require("./controller");

// Database
const mongoose = require("mongoose");
const uri = process.env.URI;
mongoose
    .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Connected to MongoDB");

        app.listen(port, () => {
            console.log("Listening at http://localhost:" + port);
        });
    })
    .catch((err) => console.log(err));

// =============== Routes ===============
app.get("/song/play/:songid", (req, res) => {
    streamAudio(req, res);
});

// ---------- Albums ----------
app.post("/album", (req, res) => {
    addAlbum(req, res);
});

app.get("/album/:albumid", (req, res) => {
    getAlbum(req, res);
});

app.get("/album", (req, res) => {
    getAlbumList(req, res);
});

app.get("/album/:albumid/ico", (req, res) => {
    getAlbumIcon(req, res);
});

// ---------- Songs ----------
app.post("/song", (req, res) => {
    addSong(req, res);
});

app.get("/song/:songid", (req, res) => {
    getSongData(req, res);
});
