const CryptoJS = require("crypto-js");
const jwt = require("jsonwebtoken");
const { Artist, Album, Track, Playlist, User, Library } = require("./model");
const playUrl = (id) => `${process.env.PLAY_URL}track/${id}/play/`;
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
    artists.sort();

    let body = {
        href: `${apiUrl}tracks/${track._id}`,
        id: track._id,
        name: track.name,
        album,
        artists,
        duration_ms: 260209,
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
        href: `${apiUrl}artists/${artist._id}`,
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

    let body = {
        href: `${apiUrl}artists/${id}/albums`,
        items,
        total: items.length,
        limit,
    };

    return body;
};

const getArtistTracks = async (id) => {
    let tracks = await Track.find({ artists: _id }).limit(limit);
    let items = [];
    await Promise.all(
        tracks.sort().map(async (track) => {
            items.push(await getTrackById(track._id));
        })
    );

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

    return {
        href: `${apiUrl}albums/${album._id}`,
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
        display_name: user.displayName,
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
        href: `${apiUrl}playlists/${playlist._id}`,
        id: playlist._id,
        name: playlist.name,
        images: playlist.image,
        owner,
        tracks: {
            href: `${apiUrl}playlists/${playlist._id}/tracks`,
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

    let body = {
        href: "https://api.spotify.com/v1/playlists/61yn9KalA3JxHhKRZWT3mW/tracks?offset=0&limit=100&market=JP&locale=en-GB,en;q=0.9,en-US;q=0.8,zh-TW;q=0.7,zh;q=0.6,zh-CN;q=0.5,ko;q=0.4,ja;q=0.3",
        items,
        total: items.length,
        limit,
    };

    return body;
};
// #endregion

// #region Library
const getUserLibrary = async (id) => {
    let library = await Library.findOne({ user: id });

    let body = {
        href: `${apiUrl}users/${id}/library`,
        id: library._id,
        user: library.user,
        albums: {
            href: `${apiUrl}users/${id}/library/albums`,
            total: library.albums.length,
        },
        artists: {
            href: `${apiUrl}users/${id}/library/artists`,
            total: library.artists.length,
        },
        playlists: {
            href: `${apiUrl}users/${id}/library/playlists`,
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

    let body = {
        href: `${apiUrl}users/library/albums`,
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

    let body = {
        href: `${apiUrl}users/library/artists`,
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

    let body = {
        href: `${apiUrl}users/library/albums`,
        items,
        total: items.length,
    };
    return body;
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
    await getUser({ email, password: hashPassword }).then((user) => {
        if (!user) error = 401;
    });

    return error ? { error } : generateToken({ email, password: hashPassword });
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
    getUserById,
    getUserLibrary,
    getUserLibraryAlbum,
    getUserLibraryArtist,
    getUserLibraryPlaylist,
    loginUser,
    registerUser,
};
