import Char from '../types/Char';
import JokerLetterTile from './JokerLetterTile';
import LetterTile from './LetterTile';

class Bench {
	static BASE_MAX_TILES = 7;

	private owner: string;
	private maxTiles: number;
	private tilesOnHand: LetterTile[];
	private points: number;

	constructor(
		owner: string,
		tilesOnHand: LetterTile[],
		maxTiles: number = Bench.BASE_MAX_TILES
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

	hasTiles(chars: Char[]): boolean {
		let usedJokers = 0;
		let hasAllTiles = true;
		chars.forEach((char) => {
			if (!this.hasTile(char)) {
				if (usedJokers < this.jokersAmount()) {
					usedJokers++;
				} else {
					hasAllTiles = false;
				}
			}
		});

		return hasAllTiles;
	}

	private jokersAmount(): number {
		return this.tilesOnHand.filter((tile) => tile.getChar() === '0').length;
	}

	useTile(char: Char): LetterTile | null {
		if (!this.hasTile(char)) {
			const index = this.tilesOnHand.findIndex(
				(tile) => tile.getChar() === '0'
			);

			if (index < 0) {
				return null;
			}

			if (!(this.tilesOnHand[index] instanceof JokerLetterTile)) {
				return null;
			}

			return (
				this.tilesOnHand.splice(index, 1)[0] as JokerLetterTile
			).convertToTile(char);
		}

		const index = this.tilesOnHand.findIndex(
			(tile) => tile.getChar() === char
		);

		return this.tilesOnHand.splice(index, 1)[0];
	}

	isFull() {
		return this.tilesOnHand.length >= this.maxTiles;
	}

	isEmpty() {
		return this.tilesOnHand.length === 0;
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
