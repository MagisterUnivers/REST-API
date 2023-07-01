const { Schema, model } = require('mongoose');
const handleMongooseError = require('../middleware/handleMongooseError');

const contactsSchema = Schema(
	{
		name: {
			type: String,
			required: [true, 'Set name for contact']
		},
		email: {
			type: String
		},
		phone: {
			type: String
		},
		favorite: {
			type: Boolean,
			default: false
		}
	},
	{ versionKey: false }
);

contactsSchema.post('save', handleMongooseError);

const Contacts = model('contact', contactsSchema);

module.exports = Contacts;
