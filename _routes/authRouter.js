const express = require("express");
const { generateToken, addUser } = require("../_controller/authController");

const authRouter = express.Router();
authRouter.route("/").post((req, res) => {
    // send auth token if user exists
    generateToken(req.body.credentials).then((token) => {
        res.send({ token });
    });
});

authRouter.route("/register").post((req, res) => {
    // add a user then send auth token
    addUser(req.body.credentials)
        .then((credentials) =>
            generateToken(credentials).then((token) => res.send({ token }))
        )
        .catch((e) => res.status(400).send({ error: e.toString() }));
});

module.exports = { authRouter };
