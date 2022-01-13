const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { Artist, Album, Track, Playlist, User } = require("./model");
const limit = 20;
const minLimit = 8;
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

const searchArtist = async (q) => {
    return await Artist.find({ name: { $regex: q, $options: "i" } }).limit(
        minLimit
    );
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

const searchAlbum = async (q) => {
    let albums = await Album.find({ name: { $regex: q, $options: "i" } }).limit(
        minLimit
    );
    let albumList = [];
    await Promise.all(
        albums.map(async (a) => albumList.push(await getAlbumById(a)))
    );
    return albumList;
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

const searchTrack = async (q) => {
    let tracks = await Track.find({
        title: { $regex: q, $options: "i" },
    }).limit(limit);
    let tracksList = [];
    await Promise.all(
        tracks.map(async (t) => tracksList.push(await getTrackById(t._id)))
    );
    return tracksList;
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

const getUserPlaylist = async (_id) => {
    const body = {
        href: "https://api.spotify.com/v1/users/lhxbfiigs9o1shde29qtkum7h/playlists?offset=0&limit=20",
        items: [
            {
                id: "0RxudW9LOmpxGkNodTCzmn",
                image: {
                    url: "https://mosaic.scdn.co/300/ab67616d0000b27324f9ba64227d5305b4594101ab67616d0000b27326f91c18f5917a3d84e4ed57ab67616d0000b273756af7c3a9d2a2c2ff37a11eab67616d0000b2739e0863f52c51d1c38a145d5a",
                    height: 300,
                    width: 300,
                },
                name: "IZ*ONE",
                owner: {
                    href: "https://api.spotify.com/v1/users/lhxbfiigs9o1shde29qtkum7h",
                    id: "lhxbfiigs9o1shde29qtkum7h",
                    display_name: "Kai3076",
                    type: "user",
                },
                tracks: {
                    href: "https://api.spotify.com/v1/playlists/0RxudW9LOmpxGkNodTCzmn/tracks",
                    total: 24,
                },
            },
        ],
        total: 1,
    };
    // TODO: Get user playlist
};
//#endregion

//#region User
const getUserLibraryPlaylist = async (_id) => {
    let user = await User.findOne({ _id });
    let pp = [];
    await Promise.all(
        user.likedPlaylist.map(async (playlist) => {
            console.log(playlist);
            pp.push(await getPlaylistById(playlist));
        })
    );

    let playlists = await Playlist.find({ creator: _id });
    return { playlists, count: playlists.length };
    // TODO: Allow user to save playlist created by other people
};

const getUserLibraryArtist = async (_id) => {
    let user = await User.findOne({ _id });
    let artists = [];
    await Promise.all(
        user.likedArtist.map(async (artist) => {
            artists.push(await getArtistById(artist));
        })
    );
    return { artists, count: user.likedArtist.length };
};

const getUserLibraryAlbum = async (_id) => {
    let user = await User.findOne({ _id });
    let albums = [];
    await Promise.all(
        user.likedAlbum.map(async (album) => {
            albums.push(await getAlbumById(album));
        })
    );
    return { albums, count: user.likedAlbum.length };
};

const setUserLibraryPlaylist = async (_id, body) => {
    return await User.findOneAndUpdate(
        { _id },
        { likedPlaylist: body.playlist },
        { new: true }
    );
};

const setUserLibraryArtist = async (_id, body) => {
    return await User.findOneAndUpdate(
        { _id },
        { likedArtist: body.artists },
        { new: true }
    );
};

const setUserLibraryAlbum = async (_id, body) => {
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

function decryptPassword(password) {
    return CryptoJS.AES.decrypt(password, process.env.PRIVATE_KEY).toString(
        CryptoJS.enc.Utf8
    );
}

async function getUser(credentials) {
    let user;
    await User.find({ ...credentials })
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
    await getUser({ email, password })
        .then((resp) => {
            req.user = resp._id.toString();
            next();
        })
        .catch((err) => {
            res.status(401).send(err);
        });
};

const registerUser = async ({ email, password }) => {
    let error = null;
    let hashPassword = CryptoJS.SHA256(decryptPassword(password)).toString();

    await getUser({ email: email }).then((user) => {
        if (user) {
            error = 409;
            return;
        }

        const userDoc = new User({
            email,
            password: hashPassword,
            type: "user",
        });
        userDoc.save((err) => {
            if (err) error = 409;
        });
    });
    return error ? { error } : generateToken({ email, password: hashPassword });
};

const loginUser = async ({ email, password }) => {
    let error = null;
    let hashPassword = CryptoJS.SHA256(decryptPassword(password)).toString();

    await getUser({ email, password: hashPassword }).then((user) => {
        if (!user) error = 401;
    });

    return error ? { error } : generateToken({ email, password: hashPassword });
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
    setUserLibraryPlaylist,
    getUserLibraryPlaylist,
    setUserLibraryArtist,
    setUserLibraryAlbum,
    getUserLibraryArtist,
    getUserLibraryAlbum,
    searchArtist,
    searchAlbum,
    searchTrack,
};
