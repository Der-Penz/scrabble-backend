import BoardPosition from './BoardPosition';
import PositionedLetterTile from './PositionedLetterTile';
import BoardTile from './BoardTile';
import MultiplierBoardTile from './MultiplierBoardTile';
import { getBoardTileForNumber, getLetterTile } from './Helpers';

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
	private board: BoardTile[][];

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

	placeWord(tiles: PositionedLetterTile[]): void {
		let worked = true;
		tiles.forEach((tile) => {
			const placed = this.placeTile(tile);
			if (worked && !placed) {
				worked = false;
			}
		});
	}

	placeTile(tile: PositionedLetterTile): boolean {
		if (!this.positionInBounds(tile.x, tile.y)) {
			return false;
		}
		this.board[tile.x][tile.y].placeTile(tile.tile);
		return true;
	}

	isTileTaken(x: number, y: number): boolean | null {
		if (!this.positionInBounds(x, y)) {
			return null;
		}
		return this.getTile(x, y).isTaken();
	}

	isEmpty() {
		return this.board.every((column) =>
			column.every((tile) => !tile.isTaken() === true)
		);
	}

	getTile(x, y): BoardTile | null {
		if (!this.positionInBounds(x, y)) {
			return null;
		}
		return this.board[x][y];
	}

	getWord(start: BoardPosition, end: BoardPosition){
		const horizontal = this.isWordHorizontal(start, end);

		const mainKey = horizontal ? 'x' : 'y';
		let word = '';
		for (let i = start[mainKey]; i <= end[mainKey]; i++) {
			let letter = '';
			if(mainKey === 'x'){
				const tile = this.getTile(i ,start.y).getTile();	
				letter = tile === null ? '' : tile.getChar();

			}else{
				const tile = this.getTile(start.x, i).getTile();			
				letter = tile === null ? '' : tile.getChar();
			}
			word += letter;
		}
		return word;
	}

	positionInBounds(x: number, y: number): boolean {
		return x >= 0 && x < Board.SIZE && y >= 0 && y < Board.SIZE;
	}

	calculatePoints(start: BoardPosition, end: BoardPosition): number {
		let points = 0;
		let wordMultiplier = 1;

		const horizontal = this.isWordHorizontal(start, end);

		const mainKey = horizontal ? 'x' : 'y';
		const secondaryKey = horizontal ? 'y' : 'x';

		for (let i = start[mainKey]; i <= end[mainKey]; i++) {
			const tile = horizontal
				? this.getTile(i, start[secondaryKey])
				: this.getTile(start[secondaryKey], i);
			if (tile === null) {
				continue;
			}
			const letterTile = tile.getTile();
			if (tile instanceof MultiplierBoardTile) {
				const multipliers = tile.useMultiplier();

				if (multipliers === null) {
					points += letterTile.getPoints();
				} else if (multipliers.type === 'LETTER') {
					points += letterTile.getPoints() * multipliers.factor;
				} else if (multipliers.type === 'WORD') {
					wordMultiplier *= multipliers.factor;
					points += letterTile.getPoints();
				}
			} else {
				points += letterTile.getPoints();
			}
		}

		return points * wordMultiplier;
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
}

export default Board;
