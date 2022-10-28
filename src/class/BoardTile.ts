import LetterTile from './LetterTile';

class BoardTile {
	private x: number;
	private y: number;
	private placedTile: LetterTile | null;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
		this.placedTile = null;
	}

	placeTile(tile: LetterTile): boolean {
		if (this.isTaken()) return false;

		this.placedTile = tile;

		return true;
	}

	isTaken(): boolean {
		return this.placedTile !== null;
	}

	getX() {
		return this.x;
	}

	getY() {
		return this.y;
	}

	getTile() {
		return this.placedTile;
	}
}

export type MultiplierType = 'WORD' | 'LETTER';

export class MultiplierBoardTile extends BoardTile {
	private factor: number;
	private multiplierType: MultiplierType;
	private used: boolean;

	constructor(
		x: number,
		y: number,
		multiplier: number,
		multiplierType: MultiplierType
	) {
		super(x, y);
		this.factor = multiplier;
		this.multiplierType = multiplierType;
		this.used = false;
	}

	useMultiplier(): {
		multiplier: number;
		multiplierType: MultiplierType;
	} | null {
		if (this.isAlreadyUsed()) return null;

		this.used = true;
		return {
			multiplier: this.factor,
			multiplierType: this.multiplierType,
		};
	}

	isAlreadyUsed(): boolean {
		return this.used;
	}
}

export default BoardTile;
