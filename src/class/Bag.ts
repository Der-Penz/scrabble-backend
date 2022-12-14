import Char from '../types/Char';
import { getLetterTile } from './Helpers';
import LetterTile from './LetterTile';

const DEFAULT_BAG_FILL_MAP_ENG =
	'00AAAAAAAAABBCCDDDDEEEEEEEEEEEEFFGGGHHIIIIIIIIIJKLLLLMMNNNNNNOOOOOOOOPPQRRRRRRSSSSTTTTTTUUUUVVWWXYYZ';
const DEFAULT_BAG_FILL_MAP_GER =
	'EEEEEEEEEEEEEEENNNNNNNNNSSSSSSSIIIIIIRRRRRRTTTTTTUUUUUUAAAAADDDDHHHHGGGLLLOOOMMMMBBWZCCFFKKPÄJÜVÖXQY00';

class Bag {
	private tiles: LetterTile[] = [];

	constructor(fillMap: string = DEFAULT_BAG_FILL_MAP_ENG) {
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
			if (this.getCount() === 0) {
				break;
			}
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
