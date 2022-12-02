import WordDirection from '../types/WordDirection';
import Board from './Board';

export class BoardPosition {
	readonly x: number;
	readonly y: number;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	equals(other: BoardPosition) {
		return this.x === other.x && this.y === other.y;
	}

	clone() {
		return new BoardPosition(this.x, this.y);
	}

	lowerX(n: number = 1) {
		return new BoardPosition(this.x - n, this.y);
	}

	lowerY(n: number = 1) {
		return new BoardPosition(this.x, this.y - n);
	}

	lower(direction: WordDirection, n?: number) {
		return direction === 'Horizontal' ? this.lowerX(n) : this.lowerY(n);
	}

	static calculateDirection(
		positions: BoardPosition[]
	): WordDirection | never {
		const baseX = positions[0].x;
		const baseY = positions[0].y;

		const allXSame = positions.every((posTiled) => posTiled.x === baseX);
		const allYSame = positions.every((posTiled) => posTiled.y === baseY);

		if (!allXSame && !allYSame) {
			throw new Error('Illegal Placement');
		}

		if (allXSame && !allYSame) {
			return 'Vertical';
		} else if (!allXSame && allYSame) {
			return 'Horizontal';
		}

		//if it a one letter placement just use vertical
		else return 'Horizontal';
	}

	static isValid(position: BoardPosition) {
		return (
			position.x >= 0 &&
			position.y >= 0 &&
			position.x < Board.SIZE &&
			position.y < Board.SIZE
		);
	}
}

export default BoardPosition;
