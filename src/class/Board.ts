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

	constructor(
		size: number = 15,
		map: string[] = DEFAULT_BOARD_MULTIPLIER_MAP
	) {
		this.board = new Array(size);

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
	}

	getBoard(): BoardTile[][] {
		return this.board;
	}

	placeWord(tiles: PositionedLetterTile[]): void {
		tiles.forEach(this.placeTile);
	}

	placeTile(tile: PositionedLetterTile): void {
		this.board[tile.x][tile.y].placeTile(tile.tile);
	}

	isTileTaken(x: number, y: number): boolean {
		return this.getBoardTile(x, y).isTaken();
	}

	getBoardTile(x, y): BoardTile {
		return this.board[x][y];
	}

	calculatePoints(start: BoardPosition, end: BoardPosition): number {
		let points = 0;
		let wordMultiplier = 1;

		const horizontal = this.isWordHorizontal(start, end);

		const mainKey = horizontal ? 'x' : 'y';
		const secondaryKey = horizontal ? 'y' : 'x';

		for (let i = 0; i <= end[mainKey] - start[mainKey]; i++) {
			const tile = this.getBoardTile(
				start[mainKey] + i,
				start[secondaryKey]
			);
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
