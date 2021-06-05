const express = require("express");
const {
    getAlbum,
    getAlbumIcon,
    addAlbum,
    getAlbumList,
    searchAlbum,
} = require("../_controller/albumController");
const { authenticateToken } = require("../_controller/authController");

const albumRouter = express.Router();

albumRouter
    .route("/")
    .post(authenticateToken, (req, res) => addAlbum(req, res))
    .get((req, res) => {
        // return the list of all albums
        getAlbumList()
            .then((albumList) => res.send(albumList))
            .catch((err) => res.status(400).send(err));
    });

albumRouter.route("/ico/:albumid").get((req, res) => {
    // return the icon file of given album id
    try {
        res.sendFile(getAlbumIcon(req.params.albumid));
    } catch (err) {
        res.status(400).send(err);
    }
});

albumRouter.route("/search/:string").get((req, res) => {
    // return a list of albums that its name contains the string
    searchAlbum(req.params.string)
        .then((albumList) => {
            res.send(albumList);
        })
        .catch((err) => {
            res.status(400).send(err);
        });
});

albumRouter.route("/:albumid").get((req, res) =>
    // return the album with the given album id
    getAlbum(req.params.albumid)
        .then((album) => {
            res.send(album);
        })
        .catch((err) => res.status(400).send(err))
);

module.exports = { albumRouter };
