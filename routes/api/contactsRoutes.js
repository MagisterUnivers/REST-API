const express = require('express');

const contactsController = require('../../controllers/contactsController');
const { validateBody } = require('../../decorators');
const schemas = require('../../schemas/contactsSchema');
const isBodyEmpty = require('../../middleware/isBodyEmpty');
const isFavoriteStatusEmpty = require('../../middleware/isFavoriteStatusEmpty');

const router = express.Router();

router.get('/', contactsController.getAllContacts);

router.get('/:contactId', contactsController.getOneContact);

router.post(
	'/',
	isBodyEmpty,
	validateBody(schemas.contactSchema),
	contactsController.addContact
);

router.delete('/:contactId', contactsController.deleteContact);

router.put(
	'/:contactId',
	isBodyEmpty,
	validateBody(schemas.contactSchema),
	contactsController.updateContactById
);

router.patch(
	'/:contactId/favorite',
	isFavoriteStatusEmpty,
	validateBody(schemas.contactUpdateFavoriteSchema),
	contactsController.updateFavoriteStatus
);

module.exports = router;
