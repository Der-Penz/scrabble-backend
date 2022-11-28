import { PlacedWord } from '../types/PlacedWord';
import Move from './Move';

class PlaceMove extends Move {
	private words: PlacedWord[];

	constructor(owner: string, words: PlacedWord[] = []) {
		super(owner);
		this.words = words;
	}

	getWord(index: number) {
		return this.words[Math.max(index, this.words.length - 1)];
	}

	getTotalPoints() {
		return this.words.reduce((total, word) => {
			return total + word.points;
		}, 0);
	}

	getAllWords() {
		return this.words;
	}

	getNumberOfWords() {
		return this.words.length;
	}

	addWord(word: PlacedWord) {
		this.words.push(word);
	}
}

export default PlaceMove;
