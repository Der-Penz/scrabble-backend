import Char from '../types/Char';
import { getLetterTile } from './Helpers';
import JokerLetterTile from './JokerLetterTile';
import LetterTile from './LetterTile';

const DEFAULT_BAG_FILL_MAP =
	'EEEEEEEEEEEEEEENNNNNNNNNSSSSSSSIIIIIIRRRRRRTTTTTTUUUUUUAAAAADDDDHHHHGGGLLLOOOMMMMBBWZCCFFKKPÄJÜVÖXQY00';

class Bag {
	private tiles: LetterTile[] = [];

	constructor(fillMap: string = DEFAULT_BAG_FILL_MAP) {
		fillMap.split('').forEach((char) => {
			this.tiles.push(getLetterTile(char as Char));
		});
		this.shuffle();
	}

	private shuffle() {
		this.tiles.sort(() => (Math.random() > 0.5 ? 1 : -1));
	}

	drawOne(): LetterTile {
		return this.tiles.pop();
	}

	drawMany(amount: number = 1) {
		const tiles: LetterTile[] = [];
		for (let i = 0; i < amount; i++) {
			tiles.push(this.drawOne());
		}
		return tiles;
	}

	swap(toSwap: LetterTile[]): LetterTile[] {
		const newOnes = this.drawMany(toSwap.length);

		this.tiles.push(...toSwap);
		this.shuffle();

		return newOnes;
	}

	getCount(): number {
		return this.tiles.length;
	}

	getTiles() {
		return this.tiles;
	}
}

export default Bag;
