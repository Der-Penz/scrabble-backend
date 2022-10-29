export class BoardPosition {
	readonly x: number;
	readonly y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	equals(other: BoardPosition) {
		return this.x === other.x && this.y === other.y;
	}
}

export default BoardPosition;
