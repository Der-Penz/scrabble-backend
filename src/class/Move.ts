import { MoveType } from '../types/MoveType';

abstract class Move {
	private owner: string;
	private timestamp: number;
	private type: MoveType;

	constructor(owner: string, type: MoveType) {
		this.owner = owner;
		this.timestamp = Date.now();
		this.type = type;
	}

	getTimestamp() {
		return this.timestamp;
	}

	getPlacer() {
		return this.owner;
	}

	getType() {
		return this.type;
	}
}

export default Move;
