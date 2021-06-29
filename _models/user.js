const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const queueSchema = new Schema({
	list: {
		type: Array,
		required: true,
	},
});

const userSchema = new Schema(
	{
		hash: {
			type: String,
			required: true,
		},
		playingSong: {
			type: String,
		},
		queue: [queueSchema],
	},
	{ timestamps: true }
);

const User = mongoose.model('User', userSchema);
const Queue = mongoose.model('Queue', queueSchema);

module.exports = { User, Queue };
