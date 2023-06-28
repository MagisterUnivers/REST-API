const express = require('express');
const Contacts = require('../../models/contacts');

const { HttpError } = require('../../helpers');
const Joi = require('joi');

const contactSchema = Joi.object({
	name: Joi.string()
		.regex(/^[a-zA-Z0-9 ]*$/)
		.required()
		.messages({
			'any.required': 'Missing required name field',
			'string.regex': 'Invalid characters in name field'
		}),
	email: Joi.string()
		.email()
		.required()
		.messages({ 'any.required': 'Missing required email field' }),
	phone: Joi.string()
		.min(7)
		.max(14)
		.pattern(/^[0-9()-]+$/)
		.required()
		.messages({ 'any.required': 'Missing required phone field' })
});

//
//

const updateStatusContact = async (contactId, body) => {
	if (!body || !body.favorite) {
		throw HttpError(400, 'Missing field favorite');
	}

	const result = await Contacts.findByIdAndUpdate(
		contactId,
		{ $set: { favorite: body.favorite } },
		{ new: true }
	);

	if (!result) {
		throw HttpError(404, 'Not found');
	}

	return result;
};

//
//

const router = express.Router();

router.get('/', async (req, res, next) => {
	const result = await Contacts.find();
	res.json(result);
});

router.get('/:contactId', async (req, res, next) => {
	try {
		const { contactId } = req.params;
		const result = await Contacts.findById(contactId).exec();
		if (!result) throw HttpError(404, `Contact with id=${contactId} not found`);
		res.json(result);
	} catch (error) {
		next(error);
	}
});

router.post('/', async (req, res, next) => {
	try {
		const { error } = contactSchema.validate(req.body);
		if (error) throw HttpError(400, error.message);
		const result = await Contacts.create(req.body);
		res.status(201).json(result);
	} catch (error) {
		next(error);
	}
});

router.delete('/:contactId', async (req, res, next) => {
	try {
		const { contactId } = req.params;
		const result = await Contacts.findByIdAndRemove(contactId);
		if (!result) throw HttpError(404, `Contact with id=${contactId} not found`);
		res.json({ message: 'Contact deleted' });
	} catch (error) {
		next(error);
	}
});

router.put('/:contactId', async (req, res, next) => {
	try {
		const { error } = contactSchema.validate(req.body);
		if (error) throw HttpError(400, error.message);

		const { contactId } = req.params;
		const result = await Contacts.findByIdAndUpdate(contactId, req.body);
		if (!result) throw HttpError(404, `Contact with id=${contactId} not found`);

		res.json(result);
	} catch (error) {
		next(error);
	}
});

router.patch('/:contactId/favorite', async (req, res, next) => {
	try {
		const { contactId } = req.params;
		const { body } = req;

		const result = await updateStatusContact(contactId, body);

		res.json(result);
	} catch (error) {
		next(error);
	}
});

module.exports = router;
