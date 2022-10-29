import Char from '../types/Char';
import BoardTile from './BoardTile';
import JokerLetterTile from './JokerLetterTile';
import LetterTile from './LetterTile';
import MultiplierBoardTile from './MultiplierBoardTile';

export function getBoardTileForNumber(x: number, y: number, n: number) {
	switch (n) {
		case 1:
			return BoardTile.BASE(x, y);
		case 2:
			return MultiplierBoardTile.DOUBLE_WORD(x, y);
		case 3:
			return MultiplierBoardTile.TRIPLE_WORD(x, y);
		case 4:
			return MultiplierBoardTile.DOUBLE_LETTER(x, y);
		case 5:
			return MultiplierBoardTile.TRIPLE_LETTER(x, y);
	}
}

export function getLetterTile(char: Char) {
	if (char === '0') {
		return new JokerLetterTile(char);
	} else {
		return new LetterTile(char);
	}
}
