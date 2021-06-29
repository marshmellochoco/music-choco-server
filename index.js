// ---------- Dependencies ----------
const fs = require('fs');
const { ObjectID, ObjectId } = require('bson');
const path = require('path');
const mm = require('music-metadata');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;

// ---------- Express app initialization ----------
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ---------- Database ----------
const { Song, Album } = require('./_models/albums');
const mongoose = require('mongoose');
const { authenticateToken, generateToken, addAlbum, getUser, upload } = require('./util');
const { User, Queue } = require('./_models/user');

mongoose
	.connect(process.env.URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useCreateIndex: true,
	})
	.then(() => {
		console.log('Connected to MongoDB');
		app.listen(port, () => {
			console.log('Listening at http://localhost:' + port);
		});
	});

const conn = mongoose.createConnection(process.env.SONG_URI);

conn.once('open', function () {
	var gfs = new mongoose.mongo.GridFSBucket(conn.db, { bucketName: 'song' });

	// ---------- Routers ----------
	const songRouter = express.Router();
	songRouter.route('/').post(authenticateToken, upload.single('file'), async (req, res) => {
		const readStream = gfs.openDownloadStream(req.file.id);
		const writeStream = fs.createWriteStream(`./temp/${req.file.id}.mp3`);

		await readStream
			.pipe(writeStream)
			.on('error', (err) => console.log('error', err))
			.once('finish', async () =>
				mm.parseFile(`./temp/${req.file.id}.mp3`, { duration: true }).then((metadata) => {
					fs.unlink(`./temp/${req.file.id}.mp3`, (err) => {
						if (err) throw err;
					});
					const songDoc = new Song({
						duration: Math.floor(metadata.format.duration),
						title: metadata.common.title,
						songDoc: req.file.id,
					});

					Album.updateOne(
						{ _id: ObjectId(req.body.albumID) },
						{ $push: { songs: songDoc } }
					)
						.then((result) => res.send(result))
						.catch((err) => res.status(400).send(err));
				})
			);
	});

	songRouter.route('/play/:songid').get(async (req, res) => {
		if (!ObjectID.isValid(req.params.songid)) throw 'Invalid song id';
		await Album.aggregate([
			{
				$match: {
					'songs._id': ObjectID(req.params.songid),
				},
			},
			{
				$unwind: '$songs',
			},
			{
				$match: {
					'songs._id': ObjectID(req.params.songid),
				},
			},
			{
				$limit: 1,
			},
		])
			.then((result) => {
				const readStream = gfs.openDownloadStream(ObjectId(result[0].songs.songDoc));
				readStream.pipe(res, { end: true }).on('error', (err) => {
					console.log(err);
				});
			})
			.catch((err) => res.status(400).send(err));
	});

	songRouter.route('/search/:string').get(async (req, res) => {
		// return a list of songs that its title contains the string
		if (req.params.string == 'undefined' || req.params.string == '')
			throw 'Invalid query string';
		await Album.aggregate([
			{
				$match: {
					'songs.title': { $regex: req.params.string, $options: 'i' },
				},
			},
			{
				$unwind: '$songs',
			},
			{
				$match: {
					'songs.title': { $regex: req.params.string, $options: 'i' },
				},
			},
			{
				$limit: 20,
			},
		])
			.then((result) => res.send(result))
			.catch((err) => res.status(400).send(err));
	});

	songRouter
		.route('/:songid')
		.get(async (req, res) => {
			if (!ObjectID.isValid(req.params.songid)) throw 'Invalid song id';
			await Album.aggregate([
				{
					$match: {
						'songs._id': ObjectID(req.params.songid),
					},
				},
				{
					$unwind: '$songs',
				},
				{
					$match: {
						'songs._id': ObjectID(req.params.songid),
					},
				},
				{
					$limit: 1,
				},
			])
				.then((result) => res.send(result[0]))
				.catch((err) => res.status(400).send(err));
		})
		.delete((req, res) => {
			Album.aggregate([
				{
					$match: {
						'songs._id': ObjectId(req.params.songid),
					},
				},
				{
					$unwind: '$songs',
				},
				{
					$match: {
						'songs._id': ObjectId(req.params.songid),
					},
				},
				{
					$limit: 1,
				},
			]).then(async (result) => {
				Album.updateOne(
					{ _id: ObjectId(result[0]._id) },
					{ $pull: { songs: { _id: ObjectId(req.params.songid) } } }
				).catch((err) => res.status(400).send(err));
				gfs.delete(ObjectId(result[0].songs.songDoc), (err) => {
					if (err) throw err;
					res.send(result);
				});
			});
		});

	const albumRouter = express.Router();
	albumRouter
		.route('/')
		.post(authenticateToken, (req, res) => addAlbum(req, res))
		.get(async (req, res) => {
			let albumList = [];
			await Album.find()
				.then((response) => {
					response.map((r) => {
						albumList.push({
							id: r._id,
							albumname: r.albumname,
							artist: r.artist,
							releaseDate: r.releaseDate,
						});
					});
					res.send(albumList);
				})
				.catch((err) => res.status(400).send(err));
		});

	albumRouter.route('/ico/:albumid').get((req, res) => {
		// return the icon file of given album id
		try {
			let pathToImg = path.resolve(__dirname, `./Song/${req.params.albumid}.jpg`);
			let icon = fs.existsSync(pathToImg) ? pathToImg : undefined;
			if (!icon) throw 'Invalid album id';
			res.sendFile(icon);
		} catch (err) {
			console.log(err);
			res.status(400).send(err);
		}
	});

	albumRouter.route('/search/:string').get(async (req, res) => {
		if (req.params.string == 'undefined' || req.params.string == '')
			throw 'Invalid query string';
		await Album.find({
			albumname: { $regex: req.params.string, $options: 'i' },
		})
			.limit(10)
			.then((result) => res.send(result))
			.catch((err) => res.status(400).send(err));
	});

	albumRouter.route('/:albumid').get(async (req, res) => {
		let album;
		await Album.findOne({ _id: req.params.albumid })
			.then((album) => res.send(album))
			.catch((err) => res.status(400).send(err));
	});

	const authRouter = express.Router();
	authRouter.route('/login').post((req, res) => {
		// send auth token if user exists
		generateToken(req.body.credentials).then((result) => {
			res.send(result);
		});
	});

	authRouter.route('/signup').post((req, res) => {
		// add a user then send auth token
		addUser(req.body.credentials)
			.then((userDoc) => {
				generateToken(req.body.credentials).then((result) => {
					res.send(result);
				});
			})
			.catch((e) => res.status(400).send({ error: e.toString() }));
	});

	authRouter.route('/').get(authenticateToken, (req, res) => {
		if (req.user) {
			res.send({
				username: req.user.username,
				iat: req.user.exp,
				exp: req.user.exp,
			});
		}
	});

	const userRouter = express.Router();
	userRouter
		.route('/queue')
		.get(authenticateToken, (req, res) => {
			// TODO: Return the list of queue of the user
			getUser({ username: req.user.username, password: req.user.password }).then((result) => {
				User.find({
					hash: result.hash,
				})
					.then((result) => res.send(result[0]))
					.catch((err) => res.status(400).send(err));
			});
		})
		.post(authenticateToken, (req, res) => {
			User.updateOne(
				{ 'queue._id': ObjectId(req.body.queueid) },
				{ $set: { 'queue.$.list': req.body.data } }
			).then((result) => res.send(result));
		});

	userRouter.route('/queue/:queueid').get(authenticateToken, (req, res) => {
		getUser({ username: req.user.username, password: req.user.password }).then((result) => {
			User.aggregate([
				{
					$match: {
						hash: result.hash,
					},
				},
				{
					$unwind: '$queue',
				},
				{
					$match: {
						'queue._id': ObjectId(req.params.queueid),
					},
				},
				{
					$limit: 1,
				},
			])
				.then((result) => res.send(result[0]))
				.catch((err) => res.status(400).send(err));
		});
	});

	userRouter.route('/playing').post(authenticateToken, (req, res) => {
		getUser({ username: req.user.username, password: req.user.password }).then((result) => {
			User.updateOne(
				{
					hash: result.hash,
				},
				{ $set: { playingSong: req.body.songId } }
			)
				.then((result) => res.send(result))
				.catch((err) => res.status(400).send(err));
		});
	});

	// ---------- API Routes ----------
	app.use('/api/album', albumRouter);
	app.use('/api/auth', authRouter);
	app.use('/api/song', songRouter);
	app.use('/api/user', userRouter);
});

// TODO: Gotta tidy this up...
