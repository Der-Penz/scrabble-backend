import express from 'express';
import JsonErrorResponse from '../../class/JsonErrorResponse';
import JsonResponse from '../../class/JsonResponse';
import MUser from '../../Schema/User';

const statsRouter = express.Router();

statsRouter.get('/get/:id', async (req, res) => {
	const userID = req.params.id;

	if (!userID) {
		return res
			.status(400)
			.send(
				new JsonErrorResponse('ClientError', 'no user provided').json()
			);
	}

	const user = await findUserByID(userID, false);

	return res.status(200).send(new JsonResponse(user));
});

statsRouter.get('/self', async (req, res) => {
	const userID = req.user._id as string;

	if (!userID) {
		return res
			.status(400)
			.send(
				new JsonErrorResponse('ClientError', 'no user provided').json()
			);
	}

	const user = await findUserByID(userID, true);

	return res.status(200).send(new JsonResponse(user));
});

statsRouter.get('/leaderboard', async (req, res) => {
	const typeOptions = ['elo', 'wins', 'bestScore'];
	const type = req.query.type as string;
	const limit = Math.max(
		Math.min(parseInt(req.query.limit as string) || 10, 100),
		0
	);
	const page = Math.max(parseInt(req.query.page as string) || 0, 0);

	if (typeOptions.indexOf(type) === -1) {
		return res.status(400).send(
			new JsonErrorResponse('ClientError', 'invalid type option', {
				valid: typeOptions,
			}).json()
		);
	}

	const users = await MUser.find({}, { email: 0, password: 0, __v: 0 })
		.sort({ [type]: -1 })
		.skip(page * limit)
		.limit(limit)
		.lean();

	return res.status(200).send(new JsonResponse(users));
});

async function findUserByID(userID: any, email: boolean) {
	const user = await MUser.findById(userID, { __v: 0, password: 0 }).lean();

	if (user) {
		!email && delete user.email;
	}

	return user;
}

export default statsRouter;
