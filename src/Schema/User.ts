import mongoose, { Schema } from 'mongoose';
import { User } from '../types/User';

const userSchema = new Schema<User>({
	name: { type: String, required: true },
	email: { type: String, required: true },
	password: { type: String, required: true },
	bestScore: { type: Number, default: 0 },
	bestWord: { type: String, default: '' },
	elo: { type: Number, default: 0 },
	joined: { type: Date, default: Date.now() },
	lastOnline: { type: Date, default: Date.now() },
});

const User = mongoose.model('user', userSchema);

export default User;
