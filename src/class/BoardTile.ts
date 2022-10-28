import LetterTile from './LetterTile';
import MultiplierBoardTile from './MultiplierBoardTile';

export class BoardTile {
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

	static TILE_FOR_NUMBER(x: number, y: number, n: number) {
		switch (n) {
			case 1:
				return BoardTile.BASE(x, y);
			case 2:
				return MultiplierBoardTile.DOUBLE_WORD(x, y);
			case 3:
				return MultiplierBoardTile.TRIPLE_WORD(x, y);
			case 4:
				return MultiplierBoardTile.DOUBLE_LETTER(x, y);
			case 5:
				return MultiplierBoardTile.TRIPLE_LETTER(x, y);
		}
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
