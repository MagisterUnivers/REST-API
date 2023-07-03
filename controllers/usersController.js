const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jimp = require('jimp');
const fs = require('fs/promises');
const path = require('path');
const gravatar = require('gravatar');
require('dotenv').config();

const { SECRET_KEY } = process.env;

const { ctrlWrapper } = require('../decorators');
const { HttpError } = require('../helpers');
const Users = require('../models/users');

const avatarDir = path.resolve('public', 'avatars');

//

const register = async (req, res) => {
	const { email, password } = req.body;
	const user = await Users.findOne({ email });
	if (user) throw HttpError(409, 'email already in use');

	const avatarURL = gravatar.url(email, { s: '200', r: 'pg', d: 'mm' });
	const hashPassword = await bcrypt.hash(password, 10);

	const result = await Users.create({
		...req.body,
		password: hashPassword,
		avatarURL
	});

	res.status(201).json({
		user: {
			email: result.email,
			subscription: result.subscription
		}
	});
};

const login = async (req, res) => {
	const { email: userEmail, password } = req.body;
	const user = await Users.findOne({ email: userEmail });
	if (!user) throw HttpError(401, 'Email or password is wrong');

	const passwordCompare = await bcrypt.compare(password, user.password);
	if (!passwordCompare) throw HttpError(401, 'Email or password is wrong');

	const { _id: id, email, subscription } = user;
	const payload = { id };

	const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '23h' });

	await Users.findByIdAndUpdate(id, { token });
	res.json({ token, user: { email, subscription } });
};

const logout = async (req, res) => {
	const { _id } = req.user;

	await Users.findByIdAndUpdate(_id, { token: '' });

	res.status(204).json({
		message: 'No Content'
	});
};

const current = (req, res) => {
	const { email, subscription } = req.user;

	res.json({
		email,
		subscription
	});
};

const subscription = async (req, res) => {
	const { _id, subscription: currentSubscription } = req.user;
	const { newSubscription } = req.body;

	if (currentSubscription !== newSubscription) {
		const validSubscriptions = ['starter', 'pro', 'business'];
		if (validSubscriptions.includes(newSubscription)) {
			await Users.findByIdAndUpdate(_id, { subscription: newSubscription });
			res.json({ newSubscription });
		} else {
			throw HttpError(
				400,
				"Invalid subscription value. Valid options are 'starter', 'pro', or 'business'"
			);
		}
	} else {
		throw HttpError(400, 'This subscription is already in use');
	}
};

const avatars = async (req, res) => {
	// move image
	const { path: oldPath, filename } = req.file;
	const newPath = path.join(avatarDir, filename);
	await fs.rename(oldPath, newPath);
	//
	// resize image
	const image = await jimp.read(newPath);
	await image.resize(250, 250).write(newPath);
	//
	const avatarURL = path.join('avatars', filename);

	req.user.avatarURL = avatarURL;
	await req.user.updateOne({ avatarURL });
	res.json(req.user);
};

module.exports = {
	register: ctrlWrapper(register),
	login: ctrlWrapper(login),
	logout: ctrlWrapper(logout),
	current: ctrlWrapper(current),
	subscription: ctrlWrapper(subscription),
	avatars: ctrlWrapper(avatars)
};
