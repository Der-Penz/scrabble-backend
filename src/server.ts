import { log } from 'console';
import express from 'express';
import wsExpress from 'express-ws';
import cors from 'cors'
import dotenv from 'dotenv';
dotenv.config();

import logRouter from './routes/middleware/logger';
import apiRouter from './routes/api/apiRouter';
import wsSubServer from './routes/ws/wsSubServer';
import GameHandler from './GameHandler';
import Room from './class/Room';

export const { app } = wsExpress(express());

app.use(express.json());
app.use(cors());
app.use('/*', logRouter);

app.use('/api/v1', apiRouter);

app.use('/ws', wsSubServer);

app.all('/*', (_, res) => {
	res.sendStatus(404);
});

app.listen(process.env.PORT, () =>
	log('->Running server on ', process.env.PORT)
);

//Debugging
const room = new Room('debugging');
log(room.getUUID(true));
GameHandler.instance.addRoom(room);
