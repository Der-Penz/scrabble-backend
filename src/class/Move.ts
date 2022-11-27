import { PlacedWord } from '../types/PlacedWord';

class Move {
	private words: PlacedWord[];
	private placer: string;
	private timestamp: number;

	constructor(placer: string, words: PlacedWord[] = []) {
		this.placer = placer;
		this.words = words;
		this.timestamp = Date.now();
	}

	toJson() {
		return {
			placer: this.placer,
			totalPoints: this.getTotalPoints(),
			timestamp: this.timestamp,
			numberOfWords: this.getNumberOfWords(),
			words: this.words,
		};
	}

	getWord(index: number) {
		return this.words[Math.max(index, this.words.length - 1)];
	}

	getTimestamp() {
		return this.timestamp;
	}

	getTotalPoints() {
		return this.words.reduce((total, word) => {
			return total + word.points;
		}, 0);
	}

	getPlacer() {
		return this.placer;
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

export default Move;
