const { authenticateToken, getUser } = require("../util");
const { User } = require("../_models/user");
const { ObjectId } = require("bson");

// TODO: Modify router
const userRouter = require("express").Router();
userRouter.post("/playing", authenticateToken, (req, res) => {
    getUser({
        username: req.user.username,
        password: req.user.password,
    }).then((result) => {
        User.updateOne(
            {
                hash: result.hash,
            },
            { $set: { playingSong: req.body.songId } }
        )
            .then((result) => res.send(result))
            .catch((err) => res.status(400).send(err));
    });
});

userRouter
    .route("/playlist")
    .get(authenticateToken, (req, res) => {
        // TODO: Return the list of playlist of the user
        getUser({
            username: req.user.username,
            password: req.user.password,
        }).then((result) => {
            User.find({
                hash: result.hash,
            })
                .then((result) =>
                    res.send(result[0].playlist.map((q) => q._id))
                )
                .catch((err) => res.status(400).send(err));
        });
    })
    .post(authenticateToken, (req, res) => {
        User.updateOne(
            { "playlist._id": ObjectId(req.body.playlistId) },
            { $set: { "playlist.$.list": req.body.data } }
        ).then((result) => res.send(result));
    });

userRouter.route("/playlist/:playlistId").get(authenticateToken, (req, res) => {
    getUser({
        username: req.user.username,
        password: req.user.password,
    }).then((result) => {
        User.aggregate([
            {
                $match: {
                    hash: result.hash,
                },
            },
            {
                $unwind: "$playlist",
            },
            {
                $match: {
                    "playlist._id": ObjectId(req.params.playlistId),
                },
            },
            {
                $limit: 1,
            },
        ])
            .then((result) => res.send(result[0]))
            .catch((err) => res.status(400).send(err));
    });
});

module.exports = { userRouter };
