const { Schema, model } = require('mongoose');
const handleMongooseError = require('../helpers/handleMongooseError');
const { emailRegexp } = require('../constants/users');

const authSchema = Schema(
	{
		password: {
			type: String,
			minlength: 7,
			required: [true, 'Set password for user']
		},
		email: {
			type: String,
			match: emailRegexp,
			required: [true, 'Email is required'],
			unique: true
		},
		subscription: {
			type: String,
			enum: ['starter', 'pro', 'business'],
			default: 'starter'
		},
		avatarURL: {
			type: String
		},
		token: String
	},
	{ versionKey: false }
);

authSchema.post('save', handleMongooseError);

const Users = model('user', authSchema);

module.exports = Users;
