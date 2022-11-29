import MultiplierType from '../types/MultiplierType';
import BoardTile from './BoardTile';

class MultiplierBoardTile extends BoardTile {
	private factor: number;
	private type: MultiplierType;
	private used: boolean;

	constructor(x: number, y: number, factor: number, type: MultiplierType) {
		super(x, y);
		this.factor = factor;
		this.type = type;
		this.used = false;
	}

	static DOUBLE_WORD(x: number, y: number) {
		return new MultiplierBoardTile(x, y, 2, 'WORD');
	}

	static DOUBLE_LETTER(x: number, y: number) {
		return new MultiplierBoardTile(x, y, 2, 'LETTER');
	}

	static TRIPLE_WORD(x: number, y: number) {
		return new MultiplierBoardTile(x, y, 3, 'WORD');
	}

	static TRIPLE_LETTER(x: number, y: number) {
		return new MultiplierBoardTile(x, y, 3, 'LETTER');
	}

	useMultiplier(): {
		factor: number;
		type: MultiplierType;
	} {
		if (this.isAlreadyUsed())
			return {
				factor: 1,
				type: this.type,
			};

		this.used = true;
		return {
			factor: this.factor,
			type: this.type,
		};
	}

	isAlreadyUsed(): boolean {
		return this.used;
	}
}

export default MultiplierBoardTile;
