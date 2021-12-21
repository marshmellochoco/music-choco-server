const { Album, Artist, Track, User, Playlist } = require("./model");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const limit = 20;

const getFeaturedArtists = async () => {
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
    return artists;
};

const getNewRelease = async () => {
    let featured = [
        "61572ca0bbd295f47f9e753f",
        "61576258f2654946c69d9380",
        "61582dd367d0bc1b70d1ae01",
        "61582e0467d0bc1b70d1ae03",
        "61b63b6fe0c844376a66b4be",
    ];
    // TODO: Get new tracks

    let albums = [];
    await Promise.all(
        featured.map(async (f) => {
            albums.push(await getAlbumById(f));
        })
    );
    return albums;
};

//#region Artist
const getArtistById = async (_id) => {
    return await Artist.findOne({ _id });
};

const getArtistAlbums = async (_id) => {
    let albums = await Album.find({ artists: _id });
    let completeAlbums = [];
    await Promise.all(
        albums.map(async (album) => {
            let artists = [];
            await Promise.all(
                album.artists.map(async (artist) => {
                    artists.push(await getArtistById(artist));
                })
            );
            completeAlbums.push({ ...album._doc, artists });
        })
    );
    return { items: [...completeAlbums], count: albums.length };
};

const getArtistTracks = async (_id) => {
    let tracks = await Track.find({ artists: _id }).limit(limit);
    let completeTracks = [];
    await Promise.all(
        tracks.map(async (track) => {
            let artists = [];
            await Promise.all(
                track.artists.map(async (artist) => {
                    artists.push(await getArtistById(artist));
                })
            );
            completeTracks.push({ ...track._doc, artists });
        })
    );
    return completeTracks;
};
//#endregion

//#region Album
const getAlbumById = async (_id) => {
    let album = await Album.findOne({ _id });
    let artists = [];
    await Promise.all(
        album.artists.map(async (artist) => {
            artists.push(await getArtistById(artist));
        })
    );
    return { ...album._doc, artists };
};

const getAlbumTracks = async (_id) => {
    let tracks = await Track.find({ album: _id }).sort({ number: 1 });
    let completeTracks = [];
    await Promise.all(
        tracks.map(async (track) => {
            let artists = [];
            await Promise.all(
                track.artists.map(async (artist) => {
                    artists.push(await getArtistById(artist));
                })
            );
            completeTracks.push({ ...track._doc, artists });
        })
    );

    return { tracks: completeTracks, count: completeTracks.length };
};
//#endregion

//#region Track
const getTrackById = async (_id) => {
    let track = await Track.findOne({ _id });
    let album = await getAlbumById(track.album);
    let artists = [];
    await Promise.all(
        track.artists.map(async (artist) => {
            artists.push(await getArtistById(artist));
        })
    );

    return { ...track._doc, album, artists };
};
//#endregion

//#region Playlist
const addPlaylist = async ({ name, image = "", tracks = [], creator }) => {
    getUserById(creator).then((result) => {
        if (!result) throw 400;
    });
    let playlistDoc = new Playlist({
        name,
        image,
        tracks,
        creator: new mongoose.Types.ObjectId(creator),
    });
    playlistDoc.save();
    return playlistDoc;
};

const getPlaylsitById = async (_id) => {
    let { id, creator, createdAt, image, name, tracks, updatedAt } =
        await Playlist.findOne({ _id }).sort({ "tracks.0": 1 });

    let { displayName } = await getUserById(creator);

    let completeTracks = [];
    await Promise.all(
        tracks.map(async (track) => {
            let t = await getTrackById(track.toString());
            completeTracks.push(t);
        })
    );

    return {
        _id: id,
        createdAt,
        creator: displayName,
        image,
        name,
        updatedAt,
        tracks: completeTracks,
        count: completeTracks.length,
    };
};

const updatePlaylist = async (_id, body) => {
    let update = await Playlist.findOneAndUpdate(
        { _id },
        { ...body },
        { new: true }
    );
    return update;
};

const deletePlaylist = async (_id) => {
    let dlt = await Playlist.deleteOne({ _id });
    return dlt;
};
//#endregion

//#region Auth
function generateToken(credentials) {
    return jwt.sign(credentials, process.env.SECRET_TOKEN, {
        expiresIn: "1h",
    });
}

function getHash(credentials) {
    let hash = crypto
        .createHash("sha256")
        .update(JSON.stringify(credentials))
        .digest("hex");
    return hash;
}

async function getUser(hash) {
    let user;
    await User.find({ hash })
        .then((res) => {
            if (res.length != 0) user = res[0];
        })
        .catch((err) => {
            throw err;
        });
    return user;
}

const userAuth = async (req, res, next) => {
    const token = req.headers["authorization"];
    if (token == null) throw "Invalid token";
    jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
        if (err) res.sendStatus(401);
        req.user = user;
    });
    next();
};

const registerUser = async (credential) => {
    let userHash = getHash(credential);
    await getUser(userHash).then((user) => {
        if (user) throw "Already registered";
        const userDoc = new User({
            hash: userHash,
            type: "user",
        });
        userDoc.save((err) => {
            if (err) {
                throw 409;
            }
        });
    });
    return generateToken(credential);
};

const loginUser = async (credential) => {
    let userHash = getHash(credential);
    await getUser(userHash).then((user) => {
        if (!user) throw 401;
    });
    return generateToken(credential);
};

const getUserById = async (_id) => {
    let user = User.findOne({ _id });
    return user;
};
//#endregion

module.exports = {
    getArtistById,
    getArtistAlbums,
    getArtistTracks,
    getAlbumById,
    getAlbumTracks,
    getTrackById,
    getFeaturedArtists,
    getNewRelease,
    addPlaylist,
    getPlaylsitById,
    updatePlaylist,
    deletePlaylist,
    userAuth,
    registerUser,
    loginUser,
};
