import fs from 'fs/promises';
import path from 'path';

class Dictionary {
	static instance: Dictionary = new Dictionary();
	private allWords: string[];
	private allreadyValidWords: string[];
	private allreadyInValidWords: string[];
	private charToIndexMap = new Map<string, number>();

	constructor() {
		this.loadWords();
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

		if (this.allreadyValidWords.includes(word)) {
			return true;
		} else if (this.allreadyInValidWords.includes(word)) {
			return false;
		} else if (
			this.allWords.includes(
				word,
				this.charToIndexMap.get(word.charAt(0))
			)
		) {
			this.allreadyValidWords.push(word);
			return true;
		}

		this.allreadyInValidWords.push(word);
		return false;
	}
}

export default Dictionary;
