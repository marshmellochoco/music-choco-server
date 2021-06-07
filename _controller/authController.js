// ---------- Models ---------
const { User } = require("../_models/user");

// ---------- Dependencies ---------
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

// ---------- Functions ----------
async function addUser(credentials) {
    await getUser(credentials).then((user) => {
        if (user) throw "User already exist";
    });

    const userDoc = new User({
        hash: crypto
            .createHash("sha256")
            .update(JSON.stringify(credentials))
            .digest("hex"),
    });

    await userDoc.save();
    return credentials;
}

async function generateToken(credentials) {
    let authToken = "";
    let userid = "";
    await getUser(credentials)
        .then((user) => {
            if (!user) return "";
            userid = user._id;
            authToken = jwt.sign(credentials, process.env.SECRET_TOKEN, {
                expiresIn: "1h",
            });
        })
        .catch((err) => {
            throw err;
        });
    return { authToken, userid };
}

function authenticateToken(req, res, next) {
    const token = req.headers["authorization"];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
        if (err) return res.sendStatus(401);
        req.user = user;
    });

    next();
}

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
    generateToken,
    addUser,
};
