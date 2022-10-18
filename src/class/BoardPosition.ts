import LetterTile from './LetterTile';

class BoardPosition {
	x: number;
	y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
}

export class PositionedLetterTile extends BoardPosition {
	tile: LetterTile;

	constructor(x: number, y: number, tile: LetterTile) {
		super(x, y);
		this.tile = tile;
	}
}

export default BoardPosition;
