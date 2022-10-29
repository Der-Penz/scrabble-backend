import fs from 'fs/promises';
import path from 'path';

class Dictionary {
	static instance: Dictionary = new Dictionary();
	private allWords: string[];
	private alreadyValidWords: string[];
	private alreadyInValidWords: string[];
	private charToIndexMap = new Map<string, number>();

	constructor() {
		this.loadWords();
		this.allWords = [];
		this.alreadyInValidWords = [];
		this.alreadyValidWords = [];
	}

	async loadWords() {
		const file = await fs.readFile(
			path.join(__dirname, '../assets/words.txt')
		);

		this.allWords = file.toString().split(/\r?\n/);
		for (let i = this.allWords.length - 1; i > 0; i--) {
			this.charToIndexMap.set(this.allWords[i].charAt(0), i);
		}
	}

	isWordValid(word: string): boolean {
		word = word.toUpperCase();

		if (this.alreadyValidWords.includes(word)) {
			return true;
		} else if (this.alreadyInValidWords.includes(word)) {
			return false;
		} else if (
			this.allWords.includes(
				word,
				this.charToIndexMap.get(word.charAt(0))
			)
		) {
			this.alreadyValidWords.push(word);
			return true;
		}

		this.alreadyInValidWords.push(word);
		return false;
	}
}

export default Dictionary;
