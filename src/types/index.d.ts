import { User } from "./User";

export {};

declare global {
	namespace Express {
		interface Request {
			isAuth: boolean;
			user: User;
		}
	}
}
