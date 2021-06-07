const express = require("express");
const {
    generateToken,
    addUser,
    authenticateToken,
} = require("../_controller/authController");

const authRouter = express.Router();
authRouter.route("/login").post((req, res) => {
    // send auth token if user exists
    generateToken(req.body.credentials).then((result) => {
        res.send(result);
    });
});

authRouter.route("/signup").post((req, res) => {
    // add a user then send auth token
    addUser(req.body.credentials)
        .then((userDoc) => {
            generateToken(req.body.credentials).then((result) => {
                res.send(result);
            });
        })
        .catch((e) => res.status(400).send({ error: e.toString() }));
});

authRouter.route("/").get(authenticateToken, (req, res) => {
    if (req.user) {
        res.send({
            username: req.user.username,
            iat: req.user.exp,
            exp: req.user.exp,
        });
    }
});

module.exports = { authRouter };
