import { log } from 'console';
import express from 'express';
const logRouter = express.Router();

logRouter.all('/', (req, res, next) => {
	log('#'.repeat(10), req.method.toUpperCase(), '#'.repeat(10));
	log('Timestamp:', new Date(Date.now()).toTimeString())
	log('Route:', req.baseUrl);
    log()
    next();
});

export default logRouter;
