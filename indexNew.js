require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const {
    getTrackById,
    getAlbumById,
    getAlbumTracks,
    getArtistById,
    getArtistAlbums,
    getArtistTracks,
    getPlaylistById,
    getPlaylistTracks,
    getUserById,
    getUserLibrary,
    getUserLibraryAlbum,
    getUserLibraryPlaylist,
    getUserLibraryArtist,
    loginUser,
    registerUser,
} = require("./queryNew");
const PORT = 8001;
const app = express();

app.use(cors());
app.use(bodyParser.json());

const validateId = (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(400).send("invalid id");
        return;
    }
    next();
};

mongoose
    .connect(process.env.MONGOBD_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB Data"));

app.listen(PORT, () => {
    console.log("Listening at http://localhost:" + PORT);
});

// #region Track
app.get("/tracks/:id", validateId, async (req, res) => {
    let track = await getTrackById(req.params.id);
    res.send(track);
});

// #endregion

// #region Artist
app.get("/artists/:id/", validateId, async (req, res) => {
    let artist = await getArtistById(req.params.id);
    res.send(artist);
});

app.get("/artists/:id/albums", validateId, async (req, res) => {
    const albums = await getArtistAlbums(req.params.id);
    res.send(albums);
});

app.get("/artists/:id/tracks", validateId, async (req, res) => {
    const tracks = await getArtistTracks(req.params.id);
    res.send(tracks);
});
// #endregion

// #region Album
app.get("/albums/:id/", validateId, async (req, res) => {
    let album = await getAlbumById(req.params.id);
    res.send(album);
});

app.get("/albums/:id/tracks", validateId, async (req, res) => {
    let tracks = await getAlbumTracks(req.params.id);
    res.send(tracks);
});
// #endregion

// #region Playlist
app.get("/playlists/:id", validateId, async (req, res) => {
    let playlist = await getPlaylistById(req.params.id);
    res.send(playlist);
});

app.get("/playlists/:id/tracks", validateId, async (req, res) => {
    let tracks = await getPlaylistTracks(req.params.id);
    res.send(tracks);
});
// #endregion

// #region Current User
// TODO: Validate the user first
app.get("/me", async (req, res) => {
    let user = await getUserById("61c849b40681e39cfc77140f");
    res.send(user);
});

app.get("/me/library", async (req, res) => {
    let library = await getUserLibrary("61c849b40681e39cfc77140f");
    res.send(library);
});

app.get("/me/library/albums", async (req, res) => {
    let user = await getUserLibraryAlbum("61c849b40681e39cfc77140f");
    res.send(user);
});

app.get("/me/library/artists", async (req, res) => {
    let user = await getUserLibraryArtist("61c849b40681e39cfc77140f");
    res.send(user);
});

app.get("/me/library/playlists", async (req, res) => {
    let user = await getUserLibraryPlaylist("61c849b40681e39cfc77140f");
    res.send(user);
});
// #endregion

// #region User
app.get("/users/:id", validateId, async (req, res) => {
    let user = await getUserById(req.params.id);
    res.send(user);
});

app.get("/users/:id/library", validateId, async (req, res) => {
    let library = await getUserLibrary(req.params.id);
    res.send(library);
});

app.get("/users/:id/library/albums", validateId, async (req, res) => {
    let user = await getUserLibraryAlbum(req.params.id);
    res.send(user);
});

app.get("/users/:id/library/artists", validateId, async (req, res) => {
    let user = await getUserLibraryArtist(req.params.id);
    res.send(user);
});

app.get("/users/:id/library/playlists", validateId, async (req, res) => {
    let user = await getUserLibraryPlaylist(req.params.id);
    res.send(user);
});
// #endregion

// #region Auth
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
// #endregion
