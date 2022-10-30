import express from 'express';
import wsExpress from 'express-ws';
import GameHandler from '../../GameHandler';
import WSMessage from '../../class/WSMessage';
import LetterTile from '../../class/LetterTile';
import JokerLetterTile from '../../class/JokerLetterTile';
import Char from '../../types/Char';
import PositionedLetterTile from '../../class/PositionedLetterTile';
import { getLetterTile } from '../../class/Helpers';
import { Objective } from '../../types/Objective';
import PointObjective from '../../class/PointObjective';
import TimeObjective from '../../class/TimeObjective';
import BaseObjective from '../../class/BaseObjective';
import SeparatedTimeObjective from '../../class/SeparatedTimeObjective';

const { app: wsServer } = wsExpress(express());

wsServer.ws('/:roomID', function (ws, req) {
	const roomID = req.params.roomID;
	let name = (req.query.name as string) || randomName();
	const roomToJoin = GameHandler.instance.getRoom(roomID);

	if (!roomToJoin) {
		ws.close();
		return;
	}

	while (roomToJoin.hasName(name)) {
		name = randomName();
	}

	roomToJoin.joinRoom(ws, name);

	ws.on('message', function (msg) {
		const message = WSMessage.ToWSMessage(msg.toString());

		if (message === null) {
			return;
		}

		console.log(`Incoming Action: ${message.getAction()}`);

		if (roomToJoin.hasEnded()) {
			return;
		}

		if (!roomToJoin.isStarted()) {
			if (roomToJoin.getHost() !== name) {
				return;
			}
			if (message.getAction() === 'game:start') {
				const { objectiveType, points, minutes } = message.getContent();

				let objective;
				switch (objectiveType as Objective) {
					case 'POINT': {
						objective = new PointObjective(points);
						break;
					}
					case 'TIME': {
						objective = new TimeObjective(
							TimeObjective.MINUTES_TO_MILLIS(minutes)
						);
						break;
					}
					case 'SEPARATED_TIME': {
						objective = new SeparatedTimeObjective(
							TimeObjective.MINUTES_TO_MILLIS(minutes)
						);
						break;
					}
					default: {
						objective = new BaseObjective();
						break;
					}
				}

				roomToJoin.startGame(objective);
			}
			return;
		}

		if (
			roomToJoin.getPlayer(ws) !==
			roomToJoin.getGame().currentPlayerName()
		) {
			return;
		}

		//actions
		if (message.getAction() === 'game:move:skip') {
			roomToJoin.getGame().skip();
		}

		if (message.getAction() === 'game:move:trade') {
			try {
				const chars = message
					.getContent()
					.map((char) => char.toUpperCase()) as Char[];
				roomToJoin.getGame().trade(chars);
			} catch (err) {
				console.error(err);
			}
		}

		if (message.getAction() === 'game:move:place') {
			try {
				const positionedTiles = message
					.getContent()
					.map(
						(positionedTile) =>
							new PositionedLetterTile(
								positionedTile.x,
								positionedTile.y,
								getLetterTile(
									positionedTile.char.toUpperCase() as Char
								)
							)
					) as PositionedLetterTile[];
				const response = roomToJoin
					.getGame()
					.placeWord(positionedTiles);

				if (!response) {
					return;
				}

				roomToJoin.log(response.string(), false);
				roomToJoin.sendMessage(
					new WSMessage('game:move:place', response.json()),
					name
				);
			} catch (err) {
				console.error(err);
			}
		}
	});

	ws.on('close', () => {
		if (!roomToJoin.getWs(name)) {
			return;
		}
		const isEmpty = roomToJoin.leaveRoom(ws);

		if (isEmpty) {
			GameHandler.instance.deleteRoom(roomToJoin.getUUID());
		}
	});
});

function randomName(): string {
	const names = [
		'funny',
		'old',
		'happy',
		'bloody',
		'brave',
		'clever',
		'crazy',
		'cute',
		'hungry',
		'lucky',
		'powerful',
		'sleepy',
		'tired',
	];
	const lastNames = [
		'frog',
		'crow',
		'falcon',
		'hawk',
		'owl',
		'parrot',
		'penguin',
		'turkey',
		'shark',
		'crab',
		'bee',
		'bear',
		'goat',
		'seal',
		'lizard',
		'chameleon',
	];

	return (
		names[Math.floor(Math.random() * names.length)] +
		' ' +
		lastNames[Math.floor(Math.random() * lastNames.length)]
	);
}

export default wsServer;
