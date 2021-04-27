// Import Dependancies
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
app.use(cors());
const port = process.env.PORT || 4000;

// Import Controllers
const { streamAudio, getSongData } = require("./controller");

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

// Routes implementation
app.get("/song/:songid", (req, res) => {
    getSongData(req, res);
});

app.get("/song/play/:songid", (req, res) => {
    streamAudio(req, res);
});

// // Insert Songs
// const songDocument = new Song({
//     songid: "abs91n",
//     title: "Some Song",
// });

// const albumDocument = new Album({
//     albumid: "abid0165",
//     artist: "MarshmelloChoco",
//     releaseDate: "2020-10-21",
//     songs: songDocument,
// });

// albumDocument.save().then((result) => console.log(result));

// Song.find().then((result) => {
//     console.log(result);
//     res.send(result);
// });

//TODO: Add data into server, use UUID as the album and song id
//TODO: Let client application adapt this data scheme 
