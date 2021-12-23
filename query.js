const { Album, Artist, Track, User, Playlist } = require("./model");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const limit = 20;
const playUrl = (id) => `${process.env.PLAY_URL}track/${id}/play/`;

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
    completeAlbums.sort();
    return { items: [...completeAlbums], count: albums.length };
};

const getArtistTracks = async (_id) => {
    let tracks = await Track.find({ artists: _id }).limit(limit);
    let completeTracks = [];
    await Promise.all(
        tracks.map(async (track) => {
            let t = await getTrackById(track._id);
            completeTracks.push(t);
        })
    );
    return { tracks: completeTracks, count: tracks.length };
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
    artists.sort();
    return { ...album._doc, artists };
};

const getAlbumTracks = async (_id) => {
    let tracks = await Track.find({ album: _id }).sort({ number: 1 });
    let completeTracks = [];
    await Promise.all(
        tracks.map(async (track) => {
            let t = await getTrackById(track._id);
            completeTracks.push(t);
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
    artists.sort();
    return { ...track._doc, url: playUrl(_id), album, artists };
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

const getPlaylistById = async (_id) => {
    let { id, creator, createdAt, image, name, tracks, updatedAt } =
        await Playlist.findOne({ _id }).sort({ "tracks.0": 1 });

    let { displayName } = await getUserById(creator);

    return {
        _id: id,
        createdAt,
        creator: displayName,
        image,
        name,
        updatedAt,
        tracks,
    };
};

const getPlaylistTracks = async (_id) => {
    let { tracks } = await Playlist.findOne({ _id }).sort({ "tracks.0": 1 });
    let completeTracks = [];
    await Promise.all(
        tracks.map(async (track) => {
            let t = await getTrackById(track.toString());
            completeTracks.push(t);
        })
    );
    completeTracks = completeTracks.sort(
        (a, b) => tracks.indexOf(a._id) - tracks.indexOf(b._id)
    );
    return { tracks: completeTracks, count: tracks.length };
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

//#region User
const getUserPlaylist = async (creator) => {
    let playlists = await Playlist.find({ creator });
    return { playlists, count: playlists.length };
};

const getUserFavArtist = async (_id) => {
    let user = await User.findOne({ _id });
    let artists = [];
    await Promise.all(
        user.likedArtist.map(async (artist) => {
            artists.push(await getArtistById(artist));
        })
    );
    return { artists, count: user.likedArtist.length };
};

const getUserFavAlbum = async (_id) => {
    let user = await User.findOne({ _id });
    let albums = [];
    await Promise.all(
        user.likedAlbum.map(async (album) => {
            albums.push(await getAlbumById(album));
        })
    );
    return { albums, count: user.likedAlbum.length };
};

const setUserFavArtist = async (_id, body) => {
    return await User.findOneAndUpdate(
        { _id },
        { likedArtist: body.artists },
        { new: true }
    );
};

const setUserFavAlbum = async (_id, body) => {
    return await User.findOneAndUpdate(
        { _id },
        { likedAlbum: body.albums },
        { new: true }
    );
};
//#endregion

//#region Auth
function generateToken(credentials) {
    return jwt.sign(credentials, process.env.SECRET_TOKEN, {
        expiresIn: "2h",
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
    if (token == null) {
        res.status(401).send("Invalid token");
        return;
    }

    let error = null;
    jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
        if (err) error = err;
        req.user = user;
    });

    if (error) {
        res.status(401).send(error);
        return;
    }

    let { email, password } = req.user;
    await getUser(getHash({ email, password }))
        .then((resp) => {
            req.user = resp._id.toString();
        })
        .catch((err) => {
            res.status(401).send(err);
        });
    next();
};

const registerUser = async (credential) => {
    // TODO: Check user exist with email instead of user hash
    let userHash = getHash(credential);
    let error = null;
    await getUser(userHash).then((user) => {
        if (user) error = 409;
        const userDoc = new User({
            hash: userHash,
            type: "user",
        });
        userDoc.save((err) => {
            if (err) error = 409;
        });
    });
    return error ? { error } : generateToken(credential);
};

const loginUser = async (credential) => {
    // TODO: Separate email and password
    let userHash = getHash(credential);
    let error = null;
    await getUser(userHash).then((user) => {
        if (!user) error = 401;
    });
    return error ? { error } : generateToken(credential);
};

const getUserById = async (_id) => {
    let user = User.findOne({ _id });
    return user;
};
//#endregion

module.exports = {
    getArtistById,
    getArtistAlbums,
    getAlbumById,
    getAlbumTracks,
    getFeaturedArtists,
    getNewRelease,
    getArtistTracks,
    getPlaylistById,
    getPlaylistTracks,
    updatePlaylist,
    deletePlaylist,
    addPlaylist,
    userAuth,
    loginUser,
    registerUser,
    getUserPlaylist,
    setUserFavArtist,
    setUserFavAlbum,
    getUserFavArtist,
    getUserFavAlbum,
};
