const { Schema, model } = require('mongoose');

const contactsSchema = Schema({
	name: String,
	email: String,
	phone: Number
});

const Contacts = model('contact', contactsSchema);

module.exports = Contacts;
