import express from 'express';
import GameHandler from '../../GameHandler';
import JsonResponse from '../../class/JsonResponse';
import Room from '../../class/Room';

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

export default apiRouter;
