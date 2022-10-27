import BoardPosition, { PositionedLetterTile } from './BoardPosition';
import BoardTile, { MultiplierBoardTile } from './BoardTile';

const DEFAULT_BOARD_MULTIPLIER_MAP = [
	'311411131114113',
	'121115111511121',
	'112111414111211',
	'411211141112114',
	'111121111121111',
	'151115111511151',
	'114111414111411',
	'311411121114113', //<--- middle
	'114111414111411',
	'151115111511151',
	'111121111121111',
	'411211141112114',
	'112111414111211',
	'121115111511121',
	'311411131114113',
];

function getTileForNumber(x: number, y: number, emoji: number) {
	switch (emoji) {
		case 1:
			return new BoardTile(x, y);
		case 2:
			return new MultiplierBoardTile(x, y, 2, 'WORD');
		case 3:
			return new MultiplierBoardTile(x, y, 3, 'WORD');
		case 4:
			return new MultiplierBoardTile(x, y, 2, 'LETTER');
		case 5:
			return new MultiplierBoardTile(x, y, 3, 'LETTER');
	}
}

class Board {
	private board: BoardTile[][];
	private size: number;

	constructor(
		size: number = 15,
		map: string[] = DEFAULT_BOARD_MULTIPLIER_MAP
	) {
		this.board = new Array(size);
		this.size = size;

		for (let i = 0; i < size; i++) {
			this.board[i] = new Array(size);
			for (let j = 0; j < size; j++) {
				this.board[i][j] = getTileForNumber(
					i,
					j,
					parseInt(map[i].at(j))
				);
			}
		}

		// this.placeTile(new PositionedLetterTile(0, 0, getDefaultTile('R')));
		// this.placeTile(new PositionedLetterTile(0, 1, getDefaultTile('A')));
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

	positionInBounds(x: number, y: number): boolean {
		return x >= 0 && x < this.size && y >= 0 && y < this.size;
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
				const multipliers = (
					tile as MultiplierBoardTile
				).useMultipier();

				if (multipliers === null) {
					points += letterTile.getPoints();
				} else if (multipliers.multiplierType === 'LETTER') {
					points += letterTile.getPoints() * multipliers.multiplier;
				} else if (multipliers.multiplierType === 'WORD') {
					wordMultiplier += multipliers.multiplier;
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
