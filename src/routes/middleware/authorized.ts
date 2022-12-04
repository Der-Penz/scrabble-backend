import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

function authorizedRoute(req: Request, res: Response, next: NextFunction) {
	const authorization = req.headers.authorization;

	const token = authorization && authorization.split(' ')[1];

	if (token == null) {
		return res.sendStatus(401);
	}

	try {
		const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

		req.user = (user as JwtPayload).name;
		req.isAuth = true;
	} catch (err) {
		console.log(err);
		
		return res.sendStatus(403);
	}

	next();
}

export default authorizedRoute;
