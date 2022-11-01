import express from 'express';
import GameHandler from '../../GameHandler';
import JsonResponse from '../../class/JsonResponse';
import Room from '../../class/Room';
import JsonErrorResponse from '../../class/JsonErrorResponse';

const apiRouter = express.Router();

apiRouter.post('/room/create', (req, res) => {
	const newRoom = new Room();

	GameHandler.instance.addRoom(newRoom);

	return res.status(200).send(
		new JsonResponse({
			message: 'room created',
			roomID: newRoom.getUUID(),
			roomJoinUrl: newRoom.getUUID(true),
		}).json()
	);
});

apiRouter.get('/room/exists', (req, res) => {
	const toCheck = req.query.id as string;

	if (!toCheck) {
		res.status(400).send(
			new JsonErrorResponse('Client Error', 'no id provided').json()
		);
		return;
	}

	const room = GameHandler.instance.getRoom(toCheck);
	res.status(200).send(
		new JsonResponse({
			idToCheck: toCheck,
			exists: room !== undefined,
		}).json()
	);
});

export default apiRouter;
