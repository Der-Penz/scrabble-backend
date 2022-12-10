import express from 'express';
import wsExpress from 'express-ws';
import ActionHandler from '../../class/Actions/ActionHandler';
import WSMessage from '../../class/WSMessage';
import GameHandler from '../../GameHandler';
import { generateRandomDoubleName } from '../../util/helpers';

const actionHandler = new ActionHandler();
const { app: wsServer } = wsExpress(express());

wsServer.ws('/:roomID', function (ws, req) {
	const roomID = req.params.roomID;
	let name = (req.query.name as string) || generateRandomDoubleName();
	let socketToken = req.query.token as string;
	const selectedRoom = GameHandler.instance.getRoom(roomID);

	if (!selectedRoom) {
		ws.close();
		return;
	}

	const joined = selectedRoom.joinRoom(ws, name, socketToken);

	if (!joined) {
		ws.close();
	}

	ws.on('message', function (msg) {
		if (selectedRoom.isEnded()) {
			return;
		}
		if(selectedRoom.isPaused()){
			return ;
		}
		console.log("new message");
		
		const message = WSMessage.ToWSMessage(msg.toString());

		if (message === null) {
			return;
		}

		const userName = selectedRoom.getPlayer(ws);
		const wsMessage = actionHandler.execute(
			selectedRoom,
			userName,
			message
		);

		if (wsMessage !== null) {
			selectedRoom.sendMessage(wsMessage, userName);
		}
	});

	ws.on('close', () => {
		if (!selectedRoom.getWs(name)) {
			return;
		}
		const isEmpty = selectedRoom.leaveRoom(ws);

		if (isEmpty) {
			GameHandler.instance.deleteRoom(selectedRoom.getUUID());
		}
	});

	ws.on('error', () => {
		if (!selectedRoom.getWs(name)) {
			return;
		}
		const isEmpty = selectedRoom.leaveRoom(ws);

		if (isEmpty) {
			GameHandler.instance.deleteRoom(selectedRoom.getUUID());
		}
	});
});

export default wsServer;
