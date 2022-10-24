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

	private getLowerTile(
		position: BoardPosition,
		direction: WordDirection
	): BoardPosition {
		const key = direction === 'Horizontal' ? 'x' : 'y';
		console.log(position);
		
		if (
			position[key] < 0 ||
			!this.board.isTileTaken(position.x, position.y)
		) {
			return null;
		}

		if (direction === 'Horizontal') {
			return (
				this.getLowerTile(
					new BoardPosition(position.x - 1, position.y),
					direction
				) || position
			);
		} else {
			return (
				this.getLowerTile(
					new BoardPosition(position.x, position.y - 1),
					direction
				) || position
			);
		}
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
		const direction = this.getWordDirection(positionedTiles);

		if (direction === 'IllegalPlacment') {
			return 'IllegalPlacement';
		}

		const sortedpositions = this.sortPositiones(positionedTiles, direction);

		//get beginning of word
		const startPos = this.getLowerTile(
			sortedpositions[0] as BoardPosition,
			direction
		) || sortedpositions[0];

		let word = '';

		//read the full word and check for errors
		let currentPosition = startPos;
		while (currentPosition !== null) {
			const index = sortedpositions.findIndex((tile) =>
				tile.equals(currentPosition)
			);
			console.log(currentPosition);
			
		
			//if you want to place the tile
			if (index >= 0) {
				const tileToBePlaced = sortedpositions.splice(index)[0];

				//not already taken
				if (
					this.board.isTileTaken(tileToBePlaced.x, tileToBePlaced.y)
				) {
					return 'TileAleardyTaken';
				}

				word += tileToBePlaced.tile.getChar();
			}
			//if you relate to a already placed tile
			else {
				const tile = this.board.getTile(
					currentPosition.x,
					currentPosition.y
				);

				if (!tile.isTaken()) {
					//end of word or gap
					if(sortedpositions.length === 0){
						//word end
						break;
					}else{
						return 'GapInWord';
					}
				}

				word += tile.getTile().getChar();
			}

			//go one higer
			if (direction === 'Horizontal') {
				currentPosition = new BoardPosition(currentPosition.x + 1, currentPosition.y)
			} else {
				currentPosition = new BoardPosition(currentPosition.x, currentPosition.y + 1)
			}
		}

		console.log(word);
		
	}

	skip() {
		this.nextPlayer();
	}
}

export default Scrabble;
