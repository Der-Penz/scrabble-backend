import { log } from 'console';
import { NextFunction, Request, Response } from 'express';

function logRoute(req: Request, res: Response, next: NextFunction) {
	log('#'.repeat(10), req.method.toUpperCase(), '#'.repeat(10));
	log('Timestamp:', new Date(Date.now()).toTimeString())
	log('Route:', req.url);
	req.isAuth && log('Authorized:', req.user.name)
    next();
}

export default logRoute;
