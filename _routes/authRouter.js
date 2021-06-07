const express = require("express");
const {
    generateToken,
    addUser,
    authenticateToken,
} = require("../_controller/authController");

const authRouter = express.Router();
authRouter.route("/login").post((req, res) => {
    // send auth token if user exists
    generateToken(req.body.credentials).then((token) => {
        res.send({ token });
    });
});

authRouter.route("/signup").post((req, res) => {
    // add a user then send auth token
    addUser(req.body.credentials)
        .then((userDoc) => {
            generateToken(req.body.credentials).then((token) =>
                res.send({ token })
            );
        })
        .catch((e) => res.status(400).send({ error: e.toString() }));
});

authRouter.route("/").get(authenticateToken, (req, res) => {
    if (req.user) {
        res.send({ iat: req.user.exp, exp: req.user.exp });
    }
});

module.exports = { authRouter };