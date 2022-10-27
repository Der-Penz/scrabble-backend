import Char from '../types/Char';
import { WordDirection } from '../types/WordDirection';
import Bag from './Bag';
import Bench from './Bench';
import Board from './Board';
import BoardPosition, { PositionedLetterTile } from './BoardPosition';
import BoardTile from './BoardTile';
import Dictionary from './Dictionary';
import LetterTile from './LetterTile';
import Room from './Room';
import WSMessage from './WSMessage';

class Scrabble {
	private board: Board;
	private benches: Map<string, Bench> = new Map();
	private currentPlayerIndex: number;
	private bag: Bag;
	private room: Room;

	constructor(room: Room, players: string[], fillMap?: string) {
		this.board = new Board();
		this.bag = new Bag(fillMap);
		this.room = room;
		this.currentPlayerIndex = this.benches.size - 1;

		players.forEach((player) =>
			this.benches.set(player, new Bench(player, this.bag.drawMany(1)))
		);
	}

	currentPlayerName(): string {
		return [...this.benches.keys()][this.currentPlayerIndex];
	}

	private currentBench(): Bench {
		return this.benches.get(this.currentPlayerName());
	}

	private nextPlayer() {
		this.currentPlayerIndex =
			(this.currentPlayerIndex + 1) % this.benches.size;

		const bench = this.currentBench();
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

		//send all the new board and the bag
		this.room.broadcastMessage(
			new WSMessage('game:state', {
				bag: this.bag,
				board: this.board.getBoard(),
				currentPlayer: playerName,
			})
		);
	}

	/**
	 * @deprecated
	 */
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

		positionedTiles.sort((a, b) => a[key] - b[key]);

		//filter out duplicates
		positionedTiles = positionedTiles.filter(
			(tile, i, self) => i === self.findIndex((t) => tile.equals(t))
		);

		return positionedTiles;
	}

	trade(which: Char[] = []) {
		const MAX_TRADES = 7;
		const currentBench = this.benches.get(this.currentPlayerName());

		const toTrade = which.reduce((prev, char, i) => {
			if (i >= MAX_TRADES) return prev;
			if (!currentBench.hasTile(char)) return prev;

			return [...prev, currentBench.useTile(char)];
		}, []);

		const tradedTiles = this.bag.swap(toTrade);

		tradedTiles.forEach((tile) => currentBench.addTile(tile));

		this.nextPlayer();
	}

	placeWord(positionedTiles: PositionedLetterTile[]) {
		const direction = this.getWordDirection(positionedTiles);

		if (direction === 'IllegalPlacment') {
			return 'IllegalPlacement';
		}

		positionedTiles = this.sortPositiones(positionedTiles, direction);

		//get beginning of word
		const startPos =
			this.getLowerTile(
				direction === 'Horizontal'
					? new BoardPosition(
							positionedTiles[0].x - 1,
							positionedTiles[0].y
					  )
					: new BoardPosition(
							positionedTiles[0].x,
							positionedTiles[0].y - 1
					  ),
				direction
			) || positionedTiles[0];

		let word = '';
		let nextToAlreadyPlacedTile = false;
		const wordTiles: PositionedLetterTile[] = [];

		//read the full word and check for errors
		let currentPosition = startPos;
		let endPos = startPos;
		while (currentPosition !== null) {
			const index = positionedTiles.findIndex((tile) =>
				tile.equals(currentPosition)
			);

			//if you want to place the tile
			if (index >= 0) {
				const tileToBePlaced = positionedTiles.splice(index, 1)[0];

				if (
					!this.board.positionInBounds(
						tileToBePlaced.x,
						tileToBePlaced.y
					)
				) {
					return 'OutOfBoard';
				}

				//not already taken
				if (
					this.board.isTileTaken(tileToBePlaced.x, tileToBePlaced.y)
				) {
					return 'TileAleardyTaken';
				}

				word += tileToBePlaced.tile.getChar();
				wordTiles.push(tileToBePlaced);
				endPos = currentPosition;
			}
			//if you relate to a already placed tile
			else {
				const tile = this.board.getTile(
					currentPosition.x,
					currentPosition.y
				);

				if (tile === null || !tile.isTaken()) {
					//end of word or gap
					if (positionedTiles.length === 0) {
						//word end
						break;
					} else {
						return 'GapInWord';
					}
				}

				word += tile.getTile().getChar();
				endPos = currentPosition;
				nextToAlreadyPlacedTile = true;
			}

			//go one higer
			if (direction === 'Horizontal') {
				currentPosition = new BoardPosition(
					currentPosition.x + 1,
					currentPosition.y
				);
			} else {
				currentPosition = new BoardPosition(
					currentPosition.x,
					currentPosition.y + 1
				);
			}
		}

		if (!nextToAlreadyPlacedTile) {
			return 'NotConnected';
		}

		if (word.length <= 1) {
			return 'WordToShort';
		}

		if (!Dictionary.instance.isWordValid(word)) {
			return 'InvalidWord';
		}

		//remove tiles from players bench
		if (
			!wordTiles.every((positionedTiles) =>
				this.currentBench().hasTile(positionedTiles.tile.getChar())
			)
		) {
			return 'TilesNotOnHand';
		}

		wordTiles.forEach((positionedTile) =>
			this.currentBench().useTile(positionedTile.tile.getChar())
		);

		//place tiles on the board
		this.board.placeWord(wordTiles);
		this.room.log(`placing word ${word}`, false);

		//add the points to the player
		const points = this.board.calculatePoints(startPos, endPos); //ERROR
		this.currentBench().addPoints(points);

		this.nextPlayer();
	}

	skip() {
		this.nextPlayer();
	}
}

export default Scrabble;
