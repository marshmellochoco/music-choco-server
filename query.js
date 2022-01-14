const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { Artist, Album, Track, Playlist, User, Library } = require("./model");
const playUrl = (id) => `${process.env.PLAY_URL}/track/${id}/play/`;
const apiUrl = process.env.API_URL;
const limit = 20;

// #region Tracks
const getTrackById = async (id) => {
    let track = await Track.findById(id);
    let album = await getAlbumById(track.album);
    let artists = [];
    await Promise.all(
        track.artists.map(async (artist) => {
            artists.push(await getArtistById(artist));
        })
    );
    artists.sort((a, b) => a._id > b._id);

    let body = {
        href: `${apiUrl}/tracks/${track._id}`,
        id: track._id,
        name: track.title,
        album,
        artists,
        duration: 30,
        play_url: playUrl(track._id),
        track_number: track.number,
    };

    return body;
};
// #endregion

// #region Artists
const getArtistById = async (id) => {
    let artist = await Artist.findById(id);
    return {
        href: `${apiUrl}/artists/${artist._id}`,
        id: artist._id,
        name: artist.name,
        image: artist.image,
    };
};

const getArtistAlbums = async (id) => {
    let albums = await Album.find({ artists: id }).limit(limit);
    let items = [];
    await Promise.all(
        albums.map(async (album) => {
            items.push(await getAlbumById(album._id));
        })
    );
    items.sort((a, b) => a._id > b._id);

    let body = {
        href: `${apiUrl}/artists/${id}/albums`,
        items,
        total: items.length,
        limit,
    };

    return body;
};

const getArtistTracks = async (id) => {
    let tracks = await Track.find({ artists: id }).limit(limit);
    let items = [];
    await Promise.all(
        tracks.map(async (track) => {
            items.push(await getTrackById(track._id));
        })
    );
    items.sort((a, b) => a._id > b._id);

    let body = {
        items,
        total: items.length,
        limit,
    };

    return body;
};
// #endregion

// #region Albums
const getAlbumById = async (id) => {
    let album = await Album.findById(id);
    let artists = [];
    await Promise.all(
        album.artists.map(async (artist) => {
            artists.push(await getArtistById(artist));
        })
    );
    artists.sort((a, b) => a._id > b._id);

    return {
        href: `${apiUrl}/albums/${album._id}`,
        id: album._id,
        name: album.name,
        artists,
        releaseDate: album.releaseDate,
        type: album.type,
        image: album.image,
    };
};

const getAlbumTracks = async (id) => {
    let tracks = await Track.find({ album: id })
        .limit(limit)
        .sort({ number: 1 });
    let items = [];
    await Promise.all(
        tracks.map(async (track) => {
            items.push(await getTrackById(track._id));
        })
    );
    items.sort((a, b) => a._id > b._id);

    let body = {
        href: "https://api.spotify.com/v1/albums/16Zkyylp6AkuzZxbCNzHWS/tracks?offset=0&limit=20&market=JP&locale=en-GB,en;q=0.9,en-US;q=0.8,zh-TW;q=0.7,zh;q=0.6,zh-CN;q=0.5,ko;q=0.4,ja;q=0.3",
        items,
        total: items.length,
        limit,
    };

    return body;
};
// #endregion

// #region User
const getUserById = async (id) => {
    let user = await User.findById(id);
    let body = {
        href: `${apiUrl}/user/${user._id}`,
        id: user._id,
        displayName: user.displayName,
        image: user.image,
        type: user.type,
    };
    return body;
};
// #endregion

// #region Playlists
const getPlaylistById = async (id) => {
    let playlist = await Playlist.findById(id);
    let owner = await getUserById(playlist.creator);

    let body = {
        href: `${apiUrl}/playlists/${playlist._id}`,
        id: playlist._id,
        name: playlist.name,
        image: playlist.image,
        updatedAt: playlist.updatedAt,
        owner,
        tracks: {
            href: `${apiUrl}/playlists/${playlist._id}/tracks`,
            total: playlist.tracks.length,
        },
    };
    return body;
};

const getPlaylistTracks = async (id) => {
    let playlist = await Playlist.findById(id).limit(limit);
    let items = [];
    await Promise.all(
        playlist.tracks.map(async (track) => {
            items.push(await getTrackById(track));
        })
    );
    items.sort((a, b) => a._id > b._id);

    let body = {
        href: "https://api.spotify.com/v1/playlists/61yn9KalA3JxHhKRZWT3mW/tracks?offset=0&limit=100&market=JP&locale=en-GB,en;q=0.9,en-US;q=0.8,zh-TW;q=0.7,zh;q=0.6,zh-CN;q=0.5,ko;q=0.4,ja;q=0.3",
        items,
        total: items.length,
        limit,
    };

    return body;
};

const addPlaylist = async (name, creator) => {
    getUserById(creator).then((result) => {
        if (!result) throw 400;
    });
    let playlistDoc = new Playlist({
        name,
        creator: new mongoose.Types.ObjectId(creator),
    });
    await playlistDoc.save();
    await Library.findOneAndUpdate(
        { user: creator },
        { $push: { playlists: playlistDoc._id } }
    );

    return await getPlaylistById(playlistDoc._id);
};

const updatePlaylist = async (user, playlist, name) => {
    let p = await Playlist.findById(playlist);
    if (p.creator.toString() !== user) return { error: 401 };
    await Playlist.findOneAndUpdate({ _id: playlist }, { name });
    return getPlaylistById(playlist);
};

const deletePlaylist = async (user, playlist) => {
    let p = await Playlist.findById(playlist);
    if (p.creator.toString() !== user) return { error: 401 };
    let deletedPlaylist = await Playlist.findOneAndDelete({ _id: playlist });
    await Library.findOneAndUpdate(
        { user },
        { $pull: { playlists: playlist } }
    );
    return deletedPlaylist._id;
};

const addTrackToPlaylist = async (user, playlist, track) => {
    let p = await Playlist.findById(playlist);
    if (p.creator.toString() !== user) return { error: 401 };
    await Playlist.findOneAndUpdate(
        { _id: playlist, tracks: { $ne: track } },
        { $push: { tracks: track } }
    );
    return getPlaylistById(playlist);
};

const removeTrackFromPlaylist = async (user, playlist, track) => {
    let p = await Playlist.findById(playlist);
    if (p.creator.toString() !== user) return { error: 401 };
    await Playlist.findOneAndUpdate(
        { _id: playlist },
        { $pull: { tracks: track } }
    );
    return getPlaylistById(playlist);
};
// #endregion

// #region Library
const getUserLibrary = async (id) => {
    let library = await Library.findOne({ user: id });

    let body = {
        href: `${apiUrl}/users/${id}/library`,
        id: library._id,
        user: library.user,
        albums: {
            href: `${apiUrl}/users/${id}/library/albums`,
            total: library.albums.length,
        },
        artists: {
            href: `${apiUrl}/users/${id}/library/artists`,
            total: library.artists.length,
        },
        playlists: {
            href: `${apiUrl}/users/${id}/library/playlists`,
            total: library.playlists.length,
        },
    };
    return body;
};

const getUserLibraryAlbum = async (id) => {
    let library = await Library.findOne({ user: id });

    let items = [];
    await Promise.all(
        library.albums.map(async (album) =>
            items.push(await getAlbumById(album))
        )
    );
    items.sort((a, b) => a._id > b._id);

    let body = {
        href: `${apiUrl}/users/library/albums`,
        items,
        total: items.length,
    };
    return body;
};

const getUserLibraryArtist = async (id) => {
    let library = await Library.findOne({ user: id });
    let items = [];
    await Promise.all(
        library.artists.map(async (artist) =>
            items.push(await getArtistById(artist))
        )
    );
    items.sort((a, b) => a._id > b._id);

    let body = {
        href: `${apiUrl}/users/library/artists`,
        items,
        total: items.length,
    };
    return body;
};

const getUserLibraryPlaylist = async (id) => {
    let library = await Library.findOne({ user: id });
    let items = [];
    await Promise.all(
        library.playlists.map(async (playlist) =>
            items.push(await getPlaylistById(playlist))
        )
    );
    items.sort((a, b) => a._id > b._id);

    let body = {
        href: `${apiUrl}/users/library/albums`,
        items,
        total: items.length,
    };
    return body;
};

const addLibraryAlbum = async (user, album) => {
    await Library.findOneAndUpdate({ user }, { $push: { albums: album } });
    return getUserLibraryAlbum(user);
};

const addLibraryArtist = async (user, artist) => {
    await Library.findOneAndUpdate({ user }, { $push: { artists: artist } });
    return getUserLibraryAlbum(user);
};

const addLibraryPlaylist = async (user, playlist) => {
    await Library.findOneAndUpdate(
        { user },
        { $push: { playlists: playlist } }
    );
    return getUserLibraryAlbum(user);
};

const removeLibraryAlbum = async (user, album) => {
    await Library.findOneAndUpdate({ user }, { $pull: { albums: album } });
    return getUserLibraryAlbum(user);
};

const removeLibraryArtist = async (user, artist) => {
    await Library.findOneAndUpdate({ user }, { $pull: { artists: artist } });
    return getUserLibraryAlbum(user);
};

const removeLibraryPlaylist = async (user, playlist) => {
    await Library.findOneAndUpdate(
        { user },
        { $pull: { playlists: playlist } }
    );
    return getUserLibraryAlbum(user);
};
// #endregion

// #region Auth
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

const loginUser = async ({ email, password }) => {
    let error = null;
    let hashPassword = CryptoJS.SHA256(decryptPassword(password)).toString();
    let user = {};
    await getUser({ email, password: hashPassword }).then((u) => {
        if (!u) error = 401;
        user = u;
    });

    return error
        ? { error }
        : {
              token: generateToken({ email, password: hashPassword }),
              displayName: user.displayName,
              id: user._id,
          };
};

const registerUser = async ({ email, password }) => {
    let error = null;
    let hashPassword = CryptoJS.SHA256(decryptPassword(password)).toString();
    await getUser({ email: email }).then((user) => {
        if (user) {
            error = 409;
            return;
        }
    });

    const userDoc = new User({
        email,
        password: hashPassword,
        type: "user",
    });
    userDoc.save((err) => {
        if (err) error = 409;
    });
    const libraryDoc = new Library({
        user: userDoc._id,
    });
    libraryDoc.save((err) => {
        if (err) error = 500;
    });

    return error
        ? { error }
        : {
              token: generateToken({ email, password: hashPassword }),
              displayName: userDoc.displayName,
              id: userDoc.id,
          };
};

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
// #endregion

// #region Search
const searchAll = async (q) => {
    let tracks = await searchTrack(q);
    let artists = await searchArtist(q);
    let albums = await searchAlbum(q);
    let playlists = await searchPlaylist(q);

    let body = {
        href: `${apiUrl}/search/${q}`,
        tracks,
        artists,
        albums,
        playlists,
    };
    return body;
};

const searchTrack = async (q) => {
    let tracks = await Track.find({
        title: { $regex: q, $options: "i" },
    }).limit(limit);

    let items = [];
    await Promise.all(
        tracks.map(async (a) => items.push(await getTrackById(a._id)))
    );
    let body = {
        href: `${apiUrl}/search/tracks/${q}`,
        items,
        total: items.length,
        limit,
    };
    return body;
};

const searchArtist = async (q) => {
    let artists = await Artist.find({
        name: { $regex: q, $options: "i" },
    }).limit(limit);

    let items = [];
    await Promise.all(
        artists.map(async (a) => items.push(await getArtistById(a._id)))
    );
    let body = {
        href: `${apiUrl}/search/artists/${q}`,
        items,
        total: items.length,
        limit,
    };
    return body;
};

const searchAlbum = async (q) => {
    let albums = await Album.find({ name: { $regex: q, $options: "i" } }).limit(
        limit
    );

    let items = [];
    await Promise.all(
        albums.map(async (a) => items.push(await getAlbumById(a._id)))
    );
    let body = {
        href: `${apiUrl}/search/albums/${q}`,
        items,
        total: items.length,
        limit,
    };
    return body;
};

const searchPlaylist = async (q) => {
    let playlists = await Playlist.find({
        name: { $regex: q, $options: "i" },
    }).limit(limit);

    let items = [];
    await Promise.all(
        playlists.map(async (a) => items.push(await getPlaylistById(a._id)))
    );
    let body = {
        href: `${apiUrl}/search/playlists/${q}`,
        items,
        total: items.length,
        limit,
    };
    return body;
};
// #endregion

module.exports = {
    getTrackById,
    getAlbumById,
    getAlbumTracks,
    getArtistById,
    getArtistAlbums,
    getArtistTracks,
    getPlaylistById,
    getPlaylistTracks,
    addPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    getUserById,
    getUserLibrary,
    getUserLibraryAlbum,
    getUserLibraryArtist,
    getUserLibraryPlaylist,
    addLibraryAlbum,
    addLibraryArtist,
    addLibraryPlaylist,
    removeLibraryAlbum,
    removeLibraryArtist,
    removeLibraryPlaylist,
    loginUser,
    registerUser,
    userAuth,
    searchAll,
    searchTrack,
    searchArtist,
    searchAlbum,
    searchPlaylist,
};
