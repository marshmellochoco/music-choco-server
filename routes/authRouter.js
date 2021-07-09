const jwt = require("jsonwebtoken");
const { User, Playlist } = require("../_models/user");
const { authenticateToken, getUser } = require("../util");

function generateToken(credentials) {
    return jwt.sign(credentials, process.env.SECRET_TOKEN, {
        expiresIn: "1h",
    });
}

async function addUser(credentials) {
    getUser(credentials).then((user) => {
        if (user) return undefined;
        const userDoc = new User({
            hash: generateToken(credentials),
            playingSong: "",
            playlist: [
                new Playlist({
                    name: "Queue",
                    list: [],
                }),
            ],
        });
        userDoc.save((err, user) => {
            if (err) res.send(err);
            return user;
        });
    });
}

const authRouter = require("express").Router();
authRouter.get("/", authenticateToken, (req, res) => {
    if (req.user) {
        res.send({
            username: req.user.username,
            iat: req.user.exp,
            exp: req.user.exp,
        });
    }
});

authRouter.post("/login", (req, res) => {
    getUser(req.body.credentials)
        .then((user) => {
            if (!user) {
                res.status(401).send("Invalid login");
                return;
            }
            res.send({
                authToken: generateToken(req.body.credentials),
                userid: user._id,
            });
        })
        .catch((err) => {
            throw err;
        });
});

authRouter.post("/signup", (req, res) => {
    addUser(req.body.credentials).then((user) => {
        if (!user) {
            res.status(409).send("User already exist");
            return;
        }
        res.send({
            authToken: generateToken(req.body.credentials),
            userid: user._id,
        });
    });
});

module.exports = { authRouter };
