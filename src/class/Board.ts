import BoardPosition from './BoardPosition';
import PositionedLetterTile from './PositionedLetterTile';
import BoardTile from './BoardTile';
import MultiplierBoardTile from './MultiplierBoardTile';
import { getBoardTileForNumber, getLetterTile } from './Helpers';
import WordDirection from '../types/WordDirection';

class Board {
	static readonly DEFAULT_MAP = [
		'311411131114113',
		'121115111511121',
		'112111414111211',
		'411211141112114',
		'111121111121111',
		'151115111511151',
		'114111414111411',
		'311411121114113',
		'114111414111411',
		'151115111511151',
		'111121111121111',
		'411211141112114',
		'112111414111211',
		'121115111511121',
		'311411131114113',
	];
	static readonly SIZE = 15;
	static readonly CENTER = (Board.SIZE + 1) / 2;
	static readonly DIRECTION_KEY: Record<WordDirection, 'x' | 'y'> = {
		Horizontal: 'x',
		Vertical: 'y',
	};
	private board: BoardTile[][];
	private activeMultipliersToConsume: BoardPosition[] = [];

	constructor(boardMap: string[] = Board.DEFAULT_MAP) {
		this.board = new Array(Board.SIZE);

		for (let i = 0; i < Board.SIZE; i++) {
			this.board[i] = new Array(Board.SIZE);
			for (let j = 0; j < Board.SIZE; j++) {
				this.board[i][j] = getBoardTileForNumber(
					i,
					j,
					parseInt(boardMap[i].at(j))
				);
			}
		}
	}

	getBoard(): BoardTile[][] {
		return this.board;
	}

	placeWord(positionTiles: PositionedLetterTile[]): boolean {
		let worked = true;
		positionTiles.forEach((tile) => {
			const placed = this.placeTile(tile);
			if (worked && !placed) {
				worked = false;
			}
		});
		return worked;
	}

	placeTile(positionTile: PositionedLetterTile): boolean {
		if (!this.positionInBounds(positionTile)) {
			return false;
		}
		this.board[positionTile.x][positionTile.y].placeTile(positionTile.tile);
		return true;
	}

	isTileTaken(position: BoardPosition): boolean | null {
		if (!this.positionInBounds(position)) {
			return null;
		}
		return this.getTile(position).isTaken();
	}

	isEmpty() {
		return this.board.every((column) =>
			column.every((tile) => !tile.isTaken() === true)
		);
	}

	getTile(position: BoardPosition): BoardTile | null {
		if (!this.positionInBounds(position)) {
			return null;
		}
		return this.board[position.x][position.y];
	}

	getWord(start: BoardPosition, end: BoardPosition) {
		const sequence = this.getTileSequence(start, end);

		return sequence.reduce(
			(word, boardTile) =>
				(word +=
					boardTile === null ? '' : boardTile.getTile().getChar()),
			''
		);
	}

	positionInBounds(position: BoardPosition): boolean {
		return BoardPosition.isValid(position);
	}

	calculatePoints(start: BoardPosition, end: BoardPosition): number {
		let points = 0;
		let wordMultiplier = 1;

		const sequence = this.getTileSequence(start, end);

		sequence.forEach((boardTile) => {
			if (boardTile === null) {
				return;
			}

			const letterTile = boardTile.getTile();
			if (boardTile instanceof MultiplierBoardTile) {
				const { type, factor } = boardTile.getMultiplier();
				this.activeMultipliersToConsume.push(
					new BoardPosition(boardTile.x, boardTile.y)
				);

				if (type === 'LETTER') {
					points += letterTile.getPoints() * factor;
				} else if (type === 'WORD') {
					wordMultiplier *= factor;
					points += letterTile.getPoints();
				}
			} else {
				points += letterTile.getPoints();
			}
		});

		return points * wordMultiplier;
	}

	useActiveMultipliers() {
		this.activeMultipliersToConsume.forEach((position) => {
			const tile = this.getTile(position);
			if (tile && tile instanceof MultiplierBoardTile) {
				tile.useMultiplier();
			}
		});
		this.activeMultipliersToConsume = [];
	}

	private isWordHorizontal(
		start: BoardPosition,
		end: BoardPosition
	): boolean {
		if (start.x === end.x) {
			return false;
		} else {
			return true;
		}
	}

	private getTileSequence(
		start: BoardPosition,
		end: BoardPosition
	): (BoardTile | null)[] {
		const direction = BoardPosition.calculateDirection([start, end]);

		let tile = start.clone();
		const tileSequence: (BoardTile | null)[] = [this.getTile(tile)];
		while (!tile.equals(end)) {
			tile = tile.lower(direction, -1);
			tileSequence.push(this.getTile(tile));
		}
		return tileSequence;
	}
}

export default Board;
