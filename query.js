const { Album, Artist, Track, User } = require("./model");
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
const addPlaylist = async (playlist) => {
    // TODO: Implementation
};

const getPlaylsitById = async (_id) => {
    // TODO: Implementation
};

const updatePlaylist = async (_id) => {
    // TODO: Implementation
};

const deletePlaylist = async (_id) => {
    // TODO: Implementation
};
//#endregion

//#region Auth
function generateToken(credentials) {
    return jwt.sign(credentials, process.env.SECRET_TOKEN, {
        expiresIn: "1h",
    });
}

function getHash(credentials) {
    return crypto
        .createHash("sha256")
        .update(JSON.stringify(credentials))
        .digest("hex");
}

async function getUser(hash) {
    let user;
    await User.find({ hash: hash })
        .then((res) => {
            if (res.length != 0) user = res[0];
        })
        .catch((err) => {
            throw err;
        });
    return user;
}

const userAuth = async (req, res, next) => {
    const token = req.headers["Authorization"];
    if (token == null) throw "Invalid token";
    jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
        if (err) res.sendStatus(401);
        req.user = user;
    });
    next();
};

const registerUser = async (credential) => {
    // TODO: validate credential
    await getUser(getHash(credential)).then((user) => {
        if (user) throw "Already registered";
        const userDoc = new User({
            hash: generateToken(credential),
            type: "user",
        });
        userDoc.save((err) => {
            if (err) throw 409;
            return generateToken(credential);
        });
    });
};

const loginUser = async (credential) => {
    await getUser(credential).then((user) => {
        if (!user) throw 401;
        return generateToken(credential);
    });
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
