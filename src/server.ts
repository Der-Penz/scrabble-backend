import { log } from 'console';
import express from 'express';
import wsExpress from 'express-ws';
import dotenv from 'dotenv';
dotenv.config();

import logRouter from './routes/middleware/logger';
import apiRouter from './routes/api/apiRouter';
import wsSubServer from './routes/ws/wsSubServer';

export const { app } = wsExpress(express());

app.use(express.json());
app.use('/*', logRouter);

app.use('/api/v1', apiRouter);

app.use('/ws', wsSubServer);

app.all('/*', (_, res) => {
	res.sendStatus(404);
});

app.listen(process.env.PORT, () =>
	log('->Running server on ', process.env.PORT)
);