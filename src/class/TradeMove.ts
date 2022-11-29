import LetterTile from './LetterTile';
import Move from './Move';

class TradeMove extends Move {
	private tradedTiles: LetterTile[];
	private newTiles: LetterTile[];

	constructor(
		owner: string,
		tradedTiles: LetterTile[],
		newTiles: LetterTile[]
	) {
		super(owner, 'Trade');
		this.tradedTiles = tradedTiles;
		this.newTiles = newTiles;
	}

	getTradedTiles(): LetterTile[] {
		return this.tradedTiles;
	}

	getNewTiles(): LetterTile[] {
		return this.newTiles;
	}
}

export default TradeMove;
