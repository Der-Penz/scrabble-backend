import { Types } from 'mongoose';

export interface User {
	_id: Types.ObjectId;
	name: string;
	email: string;
	password: string;
	elo: number;
	joined: Date;
	lastOnline: Date;
	bestScore: number;
	bestWord: string;
}
