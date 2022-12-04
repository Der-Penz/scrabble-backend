import { throws } from 'assert';
import express, { Request } from 'express';
import jwt, { JsonWebTokenError, JwtPayload } from 'jsonwebtoken';
import JsonErrorResponse from '../../class/JsonErrorResponse';
import JsonResponse from '../../class/JsonResponse';
import { User } from '../../types/User';

const authenticationRouter = express.Router();
const refreshTokens: string[] = [];

authenticationRouter.post(
	'/login',
	(req: Request<any, any, { password: string; name: string }>, res) => {
		const body = req.body;

		if (!(body.name && body.password)) {
			return res
				.status(400)
				.send(
					new JsonErrorResponse(
						'ClientError',
						'missing username or password'
					).json()
				);
		}
		const user = {
			name: body.name,
			uuid: '1',
		};
		try {
			const token = generateAccessToken(user);

			const refreshToken = jwt.sign(
				user,
				process.env.REFRESH_TOKEN_SECRET
			);
			refreshTokens.push(refreshToken);

			return res
				.status(201)
				.send(new JsonResponse({ token, refreshToken }));
		} catch (err) {
			return res
				.status(500)
				.send(
					new JsonErrorResponse(
						'ServerError',
						'internal server error'
					).json()
				);
		}
	}
);

authenticationRouter.post(
	'/token',
	(req: Request<any, any, { refreshToken: string }>, res) => {
		const refreshToken = req.body.refreshToken;

		if (!refreshToken) {
			return res
				.status(400)
				.send(
					new JsonErrorResponse(
						'ClientError',
						'no token provided'
					).json()
				);
		}

		if (!refreshTokens.includes(refreshToken)) {
			return res
				.status(403)
				.send(
					new JsonErrorResponse(
						'Unauthorized',
						'no valid refresh token'
					).json()
				);
		}

		try {
			const user: JwtPayload & User = jwt.verify(
				refreshToken,
				process.env.REFRESH_TOKEN_SECRET
			) as JwtPayload & User;

			const accessToken = generateAccessToken({
				uuid: user.uuid,
				name: user.name,
			});
			res.json({ token: accessToken });
		} catch (err) {
			return res
				.status(403)
				.send(
					new JsonErrorResponse(
						'Unauthorized',
						'no valid refresh token'
					).json()
				);
		}
	}
);

authenticationRouter.delete(
	'/logout',
	(req: Request<any, any, { refreshToken: string }>, res) => {
		const refreshToken = req.body.refreshToken;

		if (!refreshToken) {
			return res
				.status(400)
				.send(
					new JsonErrorResponse(
						'ClientError',
						'no token provided'
					).json()
				);
		}

		refreshTokens ==
			refreshTokens.filter((token) => token !== refreshToken);

		res.status(204).send(new JsonResponse({ message: 'token deleted' }));
	}
);

authenticationRouter.post('/register', (req, res) => {
	res.sendStatus(200);
});

function generateAccessToken(
	user: User,
	expirationTime: string = '15m'
): string | never {
	return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: expirationTime,
	});
}

export default authenticationRouter;
