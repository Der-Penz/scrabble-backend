import express, { Request } from 'express';
import jwt from 'jsonwebtoken';
import JsonErrorResponse from '../../class/JsonErrorResponse';
import JsonResponse from '../../class/JsonResponse';

const authenticationRouter = express.Router();

authenticationRouter.post(
	'/login',
	(req: Request<{}, {}, { password: string; name: string }>, res) => {
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

		try {
			const token = jwt.sign(
				{ name: body.name },
				process.env.ACCESS_TOKEN_SECRET,
				{ expiresIn: '1h' }
			);
			return res.status(201).send(new JsonResponse({ token }));
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
authenticationRouter.post('/register', (req, res) => {
    res.sendStatus(200)
});

export default authenticationRouter;