import express from 'express';
import GameHandler from '../../GameHandler';
import JsonResponse from '../../class/JsonResponse';
import Room from '../../class/Room';
import JsonErrorResponse from '../../class/JsonErrorResponse';
import GameState from '../../types/GameState';
import { RoomVisibility } from '../../types/RoomVisibility';

const roomRouter = express.Router();

roomRouter.post('/create', (req, res) => {
	const customID = req.query.id as string;
	const visibility = parseInt(req.query.visibility as string) || 0;

	let newRoom;
	if (GameHandler.instance.getRoom(customID)) {
		return res.status(400).send(
			new JsonErrorResponse('ClientError', 'id already in use', {
				roomID: customID,
			}).json()
		);
	}
	newRoom = new Room(customID, visibility);

	GameHandler.instance.addRoom(newRoom);

	return res.status(200).send(
		new JsonResponse({
			message: 'room created',
			roomID: newRoom.getUUID(),
			roomJoinUrl: newRoom.getUUID(true),
		}).json()
	);
});

roomRouter.get('/exists', (req, res) => {
	const toCheck = req.query.id as string;

	if (!toCheck) {
		return res
			.status(400)
			.send(
				new JsonErrorResponse(
					'ClientError',
					'no id provided',
					{}
				).json()
			);
	}

	const room = GameHandler.instance.getRoom(toCheck);

	if (!room) {
		return res.status(400).send(
			new JsonErrorResponse(
				'RoomNotExisting',
				'room with the given id does not exist',
				{
					idToCheck: toCheck,
				}
			).json()
		);
	}

	if (room.isEnded()) {
		return res.status(400).send(
			new JsonErrorResponse('GameRunning', 'game has already ended', {
				gameState: room.getGameState(),
			}).json()
		);
	}

	return res.status(200).send(
		new JsonResponse({
			idToCheck: toCheck,
			exists: room !== undefined,
			gameState: room.getGameState(),
			paused: room.isPaused(),
		}).json()
	);
});

roomRouter.get('/opened', (req, res) => {
	const rooms = GameHandler.instance
		.getPublicAvailableRooms()
		.map((room) => ({
			roomID: room.getUUID(),
			roomJoinUrl: room.getUUID(true),
			playerCount: room.getPlayerCount(),
			gameState: room.getGameState(),
			host: room.getHost(),
		}));

	return res.status(200).send(new JsonResponse(rooms).json());
});

export default roomRouter;
