import Char from '../types/Char';
import LetterTile from './LetterTile';

class JokerLetterTile extends LetterTile {
	constructor(char: Char, points?: number) {
		super(char, points);
	}

	convertToTile(which: Char): LetterTile {
		if (which === '0') {
			return new LetterTile('A');
		}
		return new LetterTile(which);
	}
}

export default JokerLetterTile;
