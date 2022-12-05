import { throws } from 'assert';
import express, { Request } from 'express';
import jwt, { JsonWebTokenError, JwtPayload } from 'jsonwebtoken';
import JsonErrorResponse from '../../class/JsonErrorResponse';
import JsonResponse from '../../class/JsonResponse';
import MUser from '../../Schema/User';
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
		const user = {} as User;
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

			const accessToken = generateAccessToken(user);
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

authenticationRouter.post(
	'/register',
	async (
		req: Request<
			any,
			any,
			{
				name: string;
				email: string;
				password: string;
			}
		>,
		res
	) => {
		const emailRegex =
			/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		const body = req.body;

		if (!(body.name && body.email && body.password)) {
			return res
				.status(400)
				.send(
					new JsonErrorResponse(
						'ClientError',
						'Please provide a username password and email'
					).json()
				);
		}

		if (!emailRegex.test(body.email)) {
			return res
				.status(400)
				.send(
					new JsonErrorResponse(
						'ClientError',
						'invalid email provided'
					).json()
				);
		}

		const user = await MUser.findOne()
			.or([{ name: body.name }, { email: body.email }])
			.exec();

		if (user) {
			return res
				.status(400)
				.send(
					new JsonErrorResponse(
						'ClientError',
						'Username or email already taken'
					).json()
				);
		}

		await MUser.create({
			email: body.email,
			name: body.name,
			password: body.password,
		});

		res.sendStatus(201).send(new JsonResponse({ created: true }).json());
	}
);

function generateAccessToken(
	user: User,
	expirationTime: string = '15m'
): string | never {
	return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: expirationTime,
	});
}

export default authenticationRouter;
