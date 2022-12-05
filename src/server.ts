import { log } from 'console';
import express from 'express';
import wsExpress from 'express-ws';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

import logRoute from './routes/middleware/logger';
import roomRouter from './routes/api/roomRouter';
import wsSubServer from './routes/ws/wsSubServer';
import GameHandler from './GameHandler';
import Room from './class/Room';
import dictionaryRouter from './routes/api/dictionaryRouter';
import authorizedRoute from './routes/middleware/authorized';
import authenticationRouter from './routes/api/authentication';
import mongoose from 'mongoose';
import MUser from './Schema/User';

const API_BASE = '/api/v1';
export const { app } = wsExpress(express());

app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(['/api/v1/word'], authorizedRoute);
app.use(logRoute);

app.use(`${API_BASE}/auth`, authenticationRouter);
app.use(`${API_BASE}/room`, roomRouter);
app.use(`${API_BASE}/word`, dictionaryRouter);

app.use('/ws', wsSubServer);

app.all('/*', (_, res) => {
	res.sendStatus(404);
});

(async () => {
	try {
		await mongoose.connect(process.env.URL_DB);
		console.log(' ______ ______ ______ ______ ');
		console.log('|                           |');
		console.log('|          Scrabble         |');
		console.log('|______ ______ ______ ______|\n');
		console.log('-> Connection to DB established');

		app.listen(process.env.PORT, () => {
			console.log('-> Running server on ', process.env.PORT, '\n');
			console.log(' ______ ______ ______ ______\n');
		});
	} catch (err) {
		console.log(err);
	}
})();
