const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const Contacts = require('../../models/contacts');

const { HttpError } = require('../../helpers');
const authenticate = require('../../middleware/authenticate');
const upload = require('../../middleware/upload');
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

const avatarDir = path.resolve('public', 'avatars');

const router = express.Router();

router.use(authenticate);

router.get('/', async (req, res, next) => {
	const { _id: owner } = req.user;
	const result = await Contacts.find({ owner }, '-createdAt -updatedAt');
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

router.post('/', upload.single('avatarURL'), async (req, res, next) => {
	try {
		const { path: oldPath, filename } = req.file;
		const newPath = path.join(avatarDir, filename);
		await fs.rename(oldPath, newPath);
		const avatarURL = path.join('avatars', filename);

		const { error } = contactSchema.validate(req.body);
		if (error) throw HttpError(400, error.message);

		const { _id: owner } = req.user;
		const result = await Contacts.create({ ...req.body, avatarURL, owner });
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

// router.patch('/:contactId/favorite', async (req, res, next) => {
//   try {
//     const { contactId } = req.params;
//     const { favorite } = req.body;

//     if (!favorite) {
//       return res.status(400).json({ message: 'Missing field favorite' });
//     }

//     const result = await Contacts.findByIdAndUpdate(
//       contactId,
//       { $set: { favorite } },
//       { new: true }
//     );

//     if (!result) {
//       return res.status(404).json({ message: 'Not found' });
//     }

//     res.json(result);
//   } catch (error) {
//     next(error);
//   }
// });

module.exports = router;
