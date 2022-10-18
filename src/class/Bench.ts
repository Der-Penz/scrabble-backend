import Char from '../types/Char';
import LetterTile from './LetterTile';

class Bench {
	private owner: string;
	private maxTiles: number;
	private tilesOnHand: LetterTile[];

	constructor(owner: string, tilesOnHand: LetterTile[], maxTiles : number = 7) {
		this.owner = owner;
		this.maxTiles = maxTiles;
		this.tilesOnHand = tilesOnHand.slice(0, this.maxTiles);
	}

	addTile(tile: LetterTile) {
		if (this.isFull()) {
			return;
		}
		this.tilesOnHand.push(tile);
	}

	hasTile(char: Char): boolean {
		return this.tilesOnHand.some((tile) => tile.getChar() === char);
	}

	useTile(char: Char) : LetterTile | null{
		if(!this.hasTile(char)) return null;

		return this.tilesOnHand.find(tile => tile.getChar() === char);
	}

	isFull() {
		return this.tilesOnHand.length >= this.maxTiles;
	}

	getBench() {
		return this.tilesOnHand;
	}

	getOwner(){
		return this.owner;
	}
}

export default Bench;
