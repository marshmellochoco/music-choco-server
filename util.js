const { GridFsStorage } = require("multer-gridfs-storage");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const { User } = require("./_models/user");

const storage = new GridFsStorage({
    url: process.env.SONG_URI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) return reject(err);
                const filename =
                    buf.toString("hex") + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: "song",
                };
                resolve(fileInfo);
            });
        });
    },
});
const upload = multer({ storage });

const authenticateToken = (req, res, next) => {
    const token = req.headers["authorization"];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
        if (err) return res.sendStatus(401);
        req.user = user;
    });

    next();
};

async function getUser(credentials) {
    let user;
    const authHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(credentials))
        .digest("hex");
    await User.find({ hash: authHash })
        .then((res) => {
            if (res.length != 0) user = res[0];
        })
        .catch((err) => {
            throw err;
        });
    return user;
}

module.exports = {
    authenticateToken,
    getUser,
    upload,
};
