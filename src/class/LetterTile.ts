import Char from '../types/Char';

class LetterTile {
	static DEFAULT_TILES_POINTS = {
		A: 1,
		E: 1,
		N: 1,
		S: 1,
		I: 1,
		R: 1,
		T: 1,
		U: 1,
		D: 1,

		H: 2,
		G: 2,
		L: 2,
		O: 2,

		M: 3,
		B: 3,
		W: 3,
		Z: 3,

		C: 4,
		F: 4,
		K: 4,
		P: 4,

		Ä: 6,
		J: 6,
		Ü: 6,
		V: 6,

		Ö: 8,
		X: 8,

		Q: 10,
		Y: 10,

		'0': 0,
	};

	private char: Char;
	private points: number;

	constructor(
		char: Char,
		points: number = LetterTile.DEFAULT_TILES_POINTS[char]
	) {
		this.char = char;
		this.points = points;
	}

	getPoints() {
		return this.points;
	}

	getChar() {
		return this.char;
	}
}

export default LetterTile;
