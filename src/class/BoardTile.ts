import LetterTile from './LetterTile';

class BoardTile {
	public readonly x: number;
	public readonly y: number;
	private placedTile: LetterTile | null;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
		this.placedTile = null;
	}

	static BASE(x: number, y: number) {
		return new BoardTile(x, y);
	}

	placeTile(tile: LetterTile): boolean {
		if (this.isTaken()) return false;

		this.placedTile = tile;

		return true;
	}

	isTaken(): boolean {
		return this.placedTile !== null;
	}

	getTile() {
		return this.placedTile;
	}
}

export default BoardTile;
