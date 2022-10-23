import Char from '../types/Char';
import { WordDirection } from '../types/WordDirection';
import Bag from './Bag';
import Bench from './Bench';
import Board from './Board';
import BoardPosition, { PositionedLetterTile } from './BoardPosition';
import Dictionary from './Dictionary';
import LetterTile from './LetterTile';
import Room from './Room';
import WSMessage from './WSMessage';

class Scrabble {
	private board: Board;
	private benches: Map<string, Bench> = new Map();
	private currentPlayer: number;
	private bag: Bag;
	private room: Room;

	constructor(room: Room, players: string[], fillMap?: string) {
		this.board = new Board();
		this.bag = new Bag(fillMap);
		this.room = room;
		this.currentPlayer = this.benches.size - 1;

		players.forEach((player) =>
			this.benches.set(player, new Bench(player, this.bag.drawMany(1)))
		);
	}

	currentPlayerName(): string {
		return [...this.benches.keys()][this.currentPlayer];
	}

	private nextPlayer() {
		this.currentPlayer = (this.currentPlayer + 1) % this.benches.size;

		const bench = this.benches.get(this.currentPlayerName());
		const playerName = this.currentPlayerName();

		while (!bench.isFull()) {
			bench.addTile(this.bag.drawOne());
		}

		this.room.sendMessage(
			new WSMessage('game:next', {
				currentPlayer: playerName,
				bench: bench,
			}),
			playerName
		);

		this.broadcastGameState();
	}

	private broadcastGameState() {
		const playerName = this.currentPlayerName();
		const bench = this.benches.get(playerName);

		//send all the new board and the bag
		this.room.broadcastMessage(
			new WSMessage('game:state', {
				bag: this.bag,
				board: this.board.getBoard(),
				currentPlayer: playerName,
			})
		);
	}

	private drawTile(): boolean {
		const playerName = this.currentPlayerName();

		if (this.benches.get(playerName).isFull()) {
			return false;
		}
		this.benches.get(this.currentPlayerName()).addTile(this.bag.drawOne());

		return true;
	}

	private getWordDirection(
		positionedTiles: PositionedLetterTile[]
	): WordDirection {
		const baseX = positionedTiles[0].x;
		const baseY = positionedTiles[0].y;

		const allXSame = positionedTiles.every(
			(posTiled) => posTiled.x === baseX
		);
		const allYSame = positionedTiles.every(
			(posTiled) => posTiled.y === baseY
		);

		if (allXSame && !allYSame) {
			return 'Vertical';
		} else if (!allXSame && allYSame) {
			return 'Horizontal';
		} else if (!allXSame && !allYSame) {
			return 'IllegalPlacment';
		} else {
			//if it a one letter placement just use vertical
			return 'Horizontal';
		}
	}

	private getWordStart(
		positionedTiles: PositionedLetterTile[],
		direction: WordDirection
	): BoardPosition {
		const key = direction === 'Horizontal' ? 'x' : 'y';

		const lowest = positionedTiles.reduce((lowest, tile) => {
			if (tile[key] < lowest[key]) {
				return tile;
			} else {
				return lowest;
			}
		});

		return lowest;
	}

	private sortPositiones(
		positionedTiles: PositionedLetterTile[],
		direction: WordDirection
	) {
		const key = direction === 'Horizontal' ? 'x' : 'y';

		return positionedTiles.sort((a, b) => a[key] - b[key]);
	}

	trade(which: Char[] = []) {
		const MAX_TRADES = 7;
		const currentBench = this.benches.get(this.currentPlayerName());
		console.log(which);

		const toTrade = which.reduce((prev, char, i) => {
			if (i >= MAX_TRADES) return prev;
			if (!currentBench.hasTile(char)) return prev;

			return [...prev, currentBench.useTile(char)];
		}, []);
		console.log(toTrade);

		const tradedTiles = this.bag.swap(toTrade);

		tradedTiles.forEach((tile) => currentBench.addTile(tile));

		console.log(tradedTiles);

		this.nextPlayer();
	}

	placeWord(positionedTiles: PositionedLetterTile[]) {
		const wordDirection = this.getWordDirection(positionedTiles);

		if (wordDirection === 'IllegalPlacment') {
			return 'IllegalPlacement';
		}

		const sortedpositions = this.sortPositiones(
			positionedTiles,
			wordDirection
		);

		let word = '';

		const newlyTakenPlaces = new Set();

		
		for (const positiendTile of sortedpositions) {
			if (this.board.isTileTaken(positiendTile.x, positiendTile.y)) {
				return 'PlaceAlreadyTaken';
			}

			if (newlyTakenPlaces.has(`${positiendTile.x}x${positiendTile.y}`)) {
				return 'TilesOnSamePlace';
			}

			newlyTakenPlaces.add(`${positiendTile.x}x${positiendTile.y}`);
			word += positiendTile.tile.getChar();
		}

		if (!Dictionary.instance.isWordValid(word)) {
			return 'InvalidWord';
		}
	}

	skip() {
		this.nextPlayer();
	}
}

export default Scrabble;
