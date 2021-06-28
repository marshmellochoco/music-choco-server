const { GridFsStorage } = require('multer-gridfs-storage');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const { Album } = require('./_models/albums');
const Jimp = require('jimp');
const fs = require('fs');

const storage = new GridFsStorage({
	url: process.env.SONG_URI,
	file: (req, file) => {
		return new Promise((resolve, reject) => {
			crypto.randomBytes(16, (err, buf) => {
				if (err) return reject(err);
				const filename = buf.toString('hex') + path.extname(file.originalname);
				const fileInfo = {
					filename: filename,
					bucketName: 'song',
				};
				resolve(fileInfo);
			});
		});
	},
});
const upload = multer({ storage });

const authenticateToken = (req, res, next) => {
	const token = req.headers['authorization'];
	if (token == null) return res.sendStatus(401);

	jwt.verify(token, process.env.SECRET_TOKEN, (err, user) => {
		if (err) return res.sendStatus(401);
		req.user = user;
	});

	next();
};

async function addAlbum(req, res) {
	let allowed = ['.png', '.jpeg', '.jpg', '.bmp', '.tiff'];
	let filename = uuid.v4();
	let storage = multer.diskStorage({
		destination: function (req, file, cb) {
			cb(null, path.join(__dirname, './Song'));
		},
		filename: function (req, file, cb) {
			if (!allowed.includes(path.extname(file.originalname))) {
				res.status(400).send(req.body);
			}
			cb(null, filename + path.extname(file.originalname));
			filename += path.extname(file.originalname);
		},
	});

	let upload = multer({
		storage: storage,
		dest: 'Song',
	}).single('icon');

	await upload(req, res, function (err) {
		if (err instanceof multer.MulterError) {
			return res.status(500).json(err);
		} else if (err) {
			return res.status(500).json(err);
		}

		const albumDoc = new Album({
			albumname: req.body.album,
			artist: req.body.artist,
			releaseDate: Date.parse(req.body.releaseDate),
			songs: [],
		});

		Album.find({
			albumname: req.body.albumName,
			artist: req.body.artist,
			releaseDate: req.body.releaseDate,
		})
			.then((response) => {
				if (response.length == 0) {
					albumDoc.save((err, album) => {
						if (err) res.send(err);
						else {
							Jimp.read(`./Song/${filename}`, (err, img) => {
								if (err) throw err;
								img.resize(200, 200)
									.writeAsync(`./Song/${albumDoc._id}.jpg`)
									.then(
										fs.unlink(`./Song/${filename}`, (err) => {
											if (err) throw err;
										})
									);
							}).then(res.send(albumDoc));
						}
					});
				} else {
					res.status(400).send(req.body);
				}
			})
			.catch((err) => {
				res.status(400).send(err);
			});
	});
}

const { User } = require('./_models/user');

async function generateToken(credentials) {
	let authToken = '';
	let userid = '';
	await getUser(credentials)
		.then((user) => {
			if (!user) return '';
			userid = user._id;
			authToken = jwt.sign(credentials, process.env.SECRET_TOKEN, {
				expiresIn: '1h',
			});
		})
		.catch((err) => {
			throw err;
		});
	return { authToken, userid };
}

async function getUser(credentials) {
	let user;
	const authHash = crypto.createHash('sha256').update(JSON.stringify(credentials)).digest('hex');
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
	upload,
	addAlbum,
	generateToken,
};
