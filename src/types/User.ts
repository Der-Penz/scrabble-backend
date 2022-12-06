import { Types } from 'mongoose';

export interface User {
	_id: Types.ObjectId | string;
	name: string;
	email: string;
	password: string;
	elo: number;
	joined: Date;
	lastOnline: Date;
	bestScore: number;
	bestWord: string;
	__v: number;
}
