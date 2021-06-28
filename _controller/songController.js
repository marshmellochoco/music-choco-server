// ---------- Models ---------
const { Song, Album } = require('../_models/albums');

// ---------- Dependencies ---------
const fs = require('fs');
const getMP3Duration = require('get-mp3-duration');
const { ObjectID, ObjectId } = require('bson');

// ---------- Functions ----------
async function addSong(req, res) {
	const songDoc = new Song({
		// TODO: Get song duration
		duration: 999,
		title: req.body.songName,
		filename: req.file.filename,
	});

	Album.updateOne({ _id: ObjectId(req.body.albumID) }, { $push: { songs: songDoc } })
		.then((result) => {
			res.send(result);
		})
		.catch((err) => res.status(400).send(err));
}

async function getSong(songId) {
	if (!ObjectID.isValid(songId)) throw 'Invalid song id';
	let song;
	await Album.aggregate([
		{
			$match: {
				'songs._id': ObjectID(songId),
			},
		},
		{
			$unwind: '$songs',
		},
		{
			$match: {
				'songs._id': ObjectID(songId),
			},
		},
		{
			$limit: 1,
		},
	])
		.then((result) => {
			song = result[0];
		})
		.catch((err) => {
			throw err;
		});
	return song;
}

async function searchSong(qString) {
	if (qString == 'undefined' || qString == '') throw 'Invalid query string';
	let songs;
	await Album.aggregate([
		{
			$match: {
				'songs.title': { $regex: qString, $options: 'i' },
			},
		},
		{
			$unwind: '$songs',
		},
		{
			$match: {
				'songs.title': { $regex: qString, $options: 'i' },
			},
		},
		{
			$limit: 20,
		},
	]).then((result) => (songs = result));
	return songs;
}

function getSongDuration(song) {
	const buffer = fs.readFileSync(`./Song/${song}`);
	const duration = getMP3Duration(buffer) / 1000;
	return Math.floor(duration);
}

module.exports = {
	searchSong,
	getSong,
	addSong,
};
