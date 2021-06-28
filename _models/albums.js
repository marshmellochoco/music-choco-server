const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const songSchema = new Schema({
	duration: {
		type: Number,
		required: true,
	},
	title: {
		type: String,
		required: true,
	},
	songDoc: {
		type: String,
		requires: true,
	},
});

const albumSchema = new Schema({
	albumname: {
		type: String,
		required: true,
	},
	artist: {
		type: String,
		required: true,
	},
	releaseDate: {
		type: Date,
	},
	songs: [songSchema],
});

const Song = mongoose.model('Song', songSchema);
const Album = mongoose.model('Album', albumSchema);

module.exports = { Song, Album };
