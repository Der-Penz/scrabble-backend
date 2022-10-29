import LetterTile from './LetterTile';
import BoardPosition from './BoardPosition';

class PositionedLetterTile extends BoardPosition {
	tile: LetterTile;

	constructor(x: number, y: number, tile: LetterTile) {
		super(x, y);
		this.tile = tile;
	}
}

export default PositionedLetterTile;
