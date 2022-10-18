import express from 'express';
import wsExpress from 'express-ws';
import GameHandler from '../../GameHandler';
import WSMessage from '../../class/WSMessage';
import LetterTile, { getDefaultTile } from '../../class/LetterTile';
import Char from '../../types/Char';

const { app: wsServer } = wsExpress(express());

wsServer.ws('/:roomID', function (ws, req) {
	const roomID = req.params.roomID;
	const name = (req.query.name as string) || randomName();
	const roomToJoin = GameHandler.instance.getRoom(roomID);

	if (!roomToJoin) {
		ws.close();
		return;
	}

	roomToJoin.joinRoom(ws, name);

	ws.on('message', function (msg) {
		const message = WSMessage.ToWSMessage(msg.toString());

		if (message === null) {
			return;
		}

		if (!roomToJoin.isStarted()) {
			if (roomToJoin.getHost() !== name) {
				return;
			}
			if (message.getAction() === 'game:start') {
				roomToJoin.startGame();
			}
			return;
		}

		//other actions
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
			const chars = message
				.getContent()
				.map((char) => char.toUpperCase()) as Char[];
			console.log(chars);
			try {
				roomToJoin.getGame().trade(chars);
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
			GameHandler.instance.deleteRoom(roomToJoin.getUUID(), 10000);
		}
	});
});

function randomName(): string {
	const names = ['devin', 'mike', 'sven'];
	const lastNames = ['from Germany', 'miller', 'Kopf', 'luther', 'singer'];

	return (
		names[Math.floor(Math.random() * names.length)] +
		' ' +
		lastNames[Math.floor(Math.random() * lastNames.length)]
	);
}

export default wsServer;
