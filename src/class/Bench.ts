import Char from '../types/Char';
import LetterTile from './LetterTile';

class Bench {
	private owner: string;
	private maxTiles: number;
	private tilesOnHand: LetterTile[];
	private points: number;

	constructor(
		owner: string,
		tilesOnHand: LetterTile[],
		maxTiles: number = 7
	) {
		this.owner = owner;
		this.maxTiles = maxTiles;
		this.tilesOnHand = tilesOnHand.slice(0, this.maxTiles);
		this.points = 0;
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

	useTile(char: Char): LetterTile | null {
		if (!this.hasTile(char)) return null;

		const index = this.tilesOnHand.findIndex(
			(tile) => tile.getChar() === char
		);

		return this.tilesOnHand.splice(index, 1)[0];
	}

	isFull() {
		return this.tilesOnHand.length >= this.maxTiles;
	}

	getBench() {
		return this.tilesOnHand;
	}

	getOwner() {
		return this.owner;
	}

	getPoints() {
		return this.points;
	}

	addPoints(newPoints) {
		this.points += newPoints;
	}
}

export default Bench;
