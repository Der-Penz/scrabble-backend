import BoardPosition from '../class/BoardPosition';

export type PlacedWord = {
	word: string;
	points: number;
	start: BoardPosition;
	end: BoardPosition;
};

export type MoveType = 'Trade' | 'Place' | 'Skip' | 'Forfeit';
