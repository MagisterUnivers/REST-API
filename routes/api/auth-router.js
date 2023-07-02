const express = require('express');
require('dotenv').config();
const usersController = require('../../controllers/usersController');

const authenticate = require('../../middleware/authenticate');
const usersSchema = require('../../schemas/usersSchema');
const isBodyEmpty = require('../../middleware/isBodyEmpty');
const validateBody = require('../../decorators/validateBody');

const authRouter = express.Router();

authRouter.post(
	'/register',
	isBodyEmpty,
	validateBody(usersSchema.userRegisterSchema),
	usersController.register
);

authRouter.post(
	'/login',
	isBodyEmpty,
	validateBody(usersSchema.userLoginSchema),
	usersController.login
);

authRouter.get('/current', authenticate, usersController.current);

authRouter.post('/logout', authenticate, usersController.logout);

authRouter.patch('/subscription', authenticate, usersController.subscription);

module.exports = authRouter;
