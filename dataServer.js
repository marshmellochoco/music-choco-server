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
    addPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    getUserById,
    getUserLibrary,
    getUserLibraryAlbum,
    getUserLibraryArtist,
    getUserLibraryPlaylist,
    addLibraryAlbum,
    addLibraryArtist,
    addLibraryPlaylist,
    removeLibraryAlbum,
    removeLibraryArtist,
    removeLibraryPlaylist,
    loginUser,
    registerUser,
    userAuth,
    searchAll,
    searchTrack,
    searchArtist,
    searchAlbum,
    searchPlaylist,
} = require("./query");
const PORT = 8000;
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
    .then(() => {
        console.log("Connected to MongoDB Data");
        app.listen(PORT, () => {
            console.log("Listening at http://"+ process.env.API_URL +":" + PORT);
        });
    });

app.get("/featured-artists", async (req, res) => {
    let featured = [
        "61572b92210d387a6980c534",
        "61582da567d0bc1b70d1adff",
        "61582dc067d0bc1b70d1ae00",
    ];
    let artists = [];
    await Promise.all(
        featured.map(async (f) => {
            artists.push(await getArtistById(f));
        })
    );
    res.send(artists);
});

app.get("/new-release", async (req, res) => {
    let newAlbum = [
        "61572ca0bbd295f47f9e753f",
        "61576258f2654946c69d9380",
        "61582dd367d0bc1b70d1ae01",
        "61582e0467d0bc1b70d1ae03",
        "61b63b6fe0c844376a66b4be",
    ];
    let albums = [];
    await Promise.all(
        newAlbum.map(async (f) => {
            albums.push(await getAlbumById(f));
        })
    );
    res.send(albums);
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

app.post("/playlists", userAuth, async (req, res) => {
    let playlist = await addPlaylist(req.body.name, req.user);
    res.send(playlist);
});

app.put("/playlists/:id/tracks", validateId, userAuth, async (req, res) => {
    let playlist = await addTrackToPlaylist(
        req.user,
        req.params.id,
        req.body.track
    );
    if (!playlist.error) res.send(playlist);
    else res.status(playlist.error).send("unauthorized");
});

app.delete("/playlists/:id/tracks", validateId, userAuth, async (req, res) => {
    let playlist = await removeTrackFromPlaylist(
        req.user,
        req.params.id,
        req.body.track
    );
    if (!playlist.error) res.send(playlist);
    else res.status(playlist.error).send("unauthorized");
});

app.put("/playlists/:id", validateId, userAuth, async (req, res) => {
    let playlist = await updatePlaylist(req.user, req.params.id, req.body.name);
    res.send(playlist);
});

app.delete("/playlists/:id", validateId, userAuth, async (req, res) => {
    let playlist = await deletePlaylist(req.user, req.params.id);
    res.send(playlist);
});
// #endregion

// #region Current User
app.get("/me", userAuth, async (req, res) => {
    let user = await getUserById(req.user);
    res.send(user);
});

app.get("/me/library", userAuth, async (req, res) => {
    let library = await getUserLibrary(req.user);
    res.send(library);
});

app.get("/me/library/albums", userAuth, async (req, res) => {
    let album = await getUserLibraryAlbum(req.user);
    res.send(album);
});

app.get("/me/library/artists", userAuth, async (req, res) => {
    let artist = await getUserLibraryArtist(req.user);
    res.send(artist);
});

app.get("/me/library/playlists", userAuth, async (req, res) => {
    let user = await getUserLibraryPlaylist(req.user);
    res.send(user);
});

app.put("/me/library/albums", userAuth, async (req, res) => {
    let album = await addLibraryAlbum(req.user, req.body.album);
    res.send(album);
});

app.put("/me/library/artists", userAuth, async (req, res) => {
    let artist = await addLibraryArtist(req.user, req.body.artist);
    res.send(artist);
});

app.put("/me/library/playlists", userAuth, async (req, res) => {
    let playlist = await addLibraryPlaylist(req.user, req.body.playlist);
    res.send(playlist);
});

app.delete("/me/library/albums", userAuth, async (req, res) => {
    let album = await removeLibraryAlbum(req.user, req.body.album);
    res.send(album);
});

app.delete("/me/library/artists", userAuth, async (req, res) => {
    let artist = await removeLibraryArtist(req.user, req.body.artist);
    res.send(artist);
});

app.delete("/me/library/playlists", userAuth, async (req, res) => {
    let playlist = await removeLibraryPlaylist(req.user, req.body.playlist);
    res.send(playlist);
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
    let body = await loginUser(req.body.credential);
    if (!body.error) res.send(body);
    else res.sendStatus(body.error);
});

app.post("/register", async (req, res) => {
    let body = await registerUser(req.body.credential);
    if (!body.error) res.send(body);
    else res.sendStatus(body.error);
});
// #endregion

// #region Search
app.post("/search", async (req, res) => {
    let body = await searchAll(req.body.q);
    res.send(body);
});

app.post("/search/tracks", async (req, res) => {
    let body = await searchTrack(req.body.q);
    res.send(body);
});

app.post("/search/artists", async (req, res) => {
    let body = await searchArtist(req.body.q);
    res.send(body);
});

app.post("/search/albums", async (req, res) => {
    let body = await searchAlbum(req.body.q);
    res.send(body);
});

app.post("/search/playlists", async (req, res) => {
    let body = await searchPlaylist(req.body.q);
    res.send(body);
});
// #endregion
