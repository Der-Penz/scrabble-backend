import Char from '../types/Char';
import WordDirection from '../types/WordDirection';
import Bag from './Bag';
import BaseObjective from './BaseObjective';
import Bench from './Bench';
import Board from './Board';
import BoardPosition from './BoardPosition';
import Dictionary from './Dictionary';
import ForfeitMove from './ForfeitMove';
import JsonErrorResponse from './JsonErrorResponse';
import JsonResponse from './JsonResponse';
import Move from './Move';
import PlaceMove from './PlaceMove';
import PositionedLetterTile from './PositionedLetterTile';
import Room from './Room';
import SeparatedTimeObjective from './SeparatedTimeObjective';
import SkipMove from './SkipMove';
import TimeObjective from './TimeObjective';
import TradeMove from './TradeMove';
import WSMessage from './WSMessage';

class Scrabble {
	private board: Board;
	private benches: Map<string, Bench> = new Map();
	private currentPlayerIndex: number;
	private bag: Bag;
	private objective: BaseObjective;
	private room: Room;
	private moveHistory: Move[];

	constructor(
		room: Room,
		players: string[],
		objective: BaseObjective,
		fillMap?: string
	) {
		this.board = new Board();
		this.bag = new Bag(fillMap);
		this.room = room;
		this.moveHistory = [];
		this.currentPlayerIndex = 0;
		this.objective = objective;

		players.forEach((player) =>
			this.benches.set(
				player,
				new Bench(player, this.bag.drawMany(Bench.BASE_MAX_TILES))
			)
		);
	}

	getBag() {
		return this.bag;
	}

	getBenches() {
		return this.benches;
	}

	getBoard() {
		return this.board;
	}

	getObjective() {
		return this.objective;
	}

	currentPlayerName(): string {
		return [...this.benches.keys()][this.currentPlayerIndex];
	}

	onTurn(who: string): boolean {
		return this.currentPlayerName() === who;
	}

	private currentBench(): Bench {
		return this.benches.get(this.currentPlayerName());
	}

	private endGame(surrenderer?: string) {
		this.room.log('Game ended');
		this.broadcastGameState();

		const { players, winner } = this.objective.calculateWinner(
			this.benches,
			surrenderer
		);

		this.room.broadcastMessage(
			new WSMessage('game:end', {
				players: players,
				winner: winner,
				surrendered: surrenderer !== undefined,
				surrenderer,
			})
		);
	}

	forfeit(who: string) {
		this.moveHistory.push(new ForfeitMove(this.currentPlayerName(), who));
		this.endGame(who);
	}

	private nextPlayer(currentMove: Move) {
		this.moveHistory.push(currentMove);
		if (this.objective.checkForGameEnd(this)) {
			this.endGame();
			return;
		}

		this.currentPlayerIndex =
			(this.currentPlayerIndex + 1) % this.benches.size;

		const bench = this.currentBench();

		while (!bench.isFull()) {
			if (this.bag.getCount() <= 0) {
				break;
			}
			bench.addTile(this.bag.drawOne());
		}

		this.room.sendMessage(
			new WSMessage('game:next', {
				benchOwner: bench.getOwner(),
				bench: bench,
			}),
			this.currentPlayerName()
		);

		this.broadcastGameState();
	}

	broadcastGameState() {
		const players: {
			[name: string]: { points: number; timeLeft: number };
		} = {} as any;

		let objective = this.getObjective();
		this.benches.forEach((bench, name) => {
			let timeLeft = 0;
			if (objective instanceof TimeObjective) {
				timeLeft = objective.getLeftTime();
			} else if (objective instanceof SeparatedTimeObjective) {
				timeLeft = objective.getLeftTime(name);
			}

			players[name] = { points: bench.getPoints(), timeLeft };
		});

		//send all the new board and the bag
		this.room.broadcastMessage(
			new WSMessage('game:state', {
				bag: this.bag,
				board: this.board.getBoard(),
				currentPlayer: this.currentPlayerName(),
				moveHistory: this.moveHistory,
				players: players,
			})
		);
	}

	private getLowerTile(
		position: BoardPosition,
		direction: WordDirection
	): BoardPosition {
		if (
			!BoardPosition.isValid(position) ||
			!this.board.isTileTaken(position)
		) {
			return null;
		}

		return (
			this.getLowerTile(position.lower(direction), direction) || position
		);
	}

	private sortPositions(
		positionedTiles: PositionedLetterTile[],
		direction: WordDirection
	) {
		const key = Board.DIRECTION_KEY[direction];

		positionedTiles.sort((a, b) => a[key] - b[key]);

		//filter out duplicates
		positionedTiles = positionedTiles.filter(
			(tile, i, self) => i === self.findIndex((t) => tile.equals(t))
		);

		return positionedTiles;
	}

	calculateAdjacentWord(
		position: PositionedLetterTile,
		direction: WordDirection
	) {
		const startPos =
			this.getLowerTile(position.lower(direction), direction) ||
			position.clone();

		let word = '';
		let currentPosition = startPos;
		let endPos = startPos;

		while (currentPosition !== null) {
			const tile = this.board.getTile(currentPosition);

			if (tile === null || !tile.isTaken()) {
				if (position.equals(currentPosition)) {
					word += position.tile.getChar();
				} else {
					//end of word
					break;
				}
			} else {
				word += tile.getTile().getChar();
			}

			endPos = currentPosition;

			//go one higher
			currentPosition = currentPosition.lower(direction, -1);

			if (!BoardPosition.isValid(currentPosition)) {
				currentPosition = null;
			}
		}

		if (word.length <= 1) {
			return null;
		}

		if (!Dictionary.instance.isWordValid(word)) {
			throw new JsonErrorResponse(
				'InvalidWord',
				'Word is not a official allowed Scrabble word',
				{ word, start: startPos, end: endPos }
			);
		}

		return { startPos, endPos, word };
	}

	trade(which: Char[] = []) {
		const MAX_TRADES = Math.min(this.bag.getCount(), 7);
		const currentBench = this.currentBench();

		const toTrade = which.reduce((prev, char, i) => {
			if (i >= MAX_TRADES) return prev;
			if (!currentBench.hasTile(char)) return prev;

			return [...prev, currentBench.useTile(char)];
		}, []);

		const newTiles = this.bag.swap(toTrade);

		newTiles.forEach((tile) => currentBench.addTile(tile));

		const move = new TradeMove(this.currentPlayerName(), toTrade, newTiles);
		this.nextPlayer(move);
		return newTiles;
	}

	placeWord(
		positionedTiles: PositionedLetterTile[],
		ghostPlace: boolean
	): JsonResponse | JsonErrorResponse {
		let direction: WordDirection = 'Horizontal';
		try {
			direction = BoardPosition.calculateDirection(positionedTiles);
		} catch (err) {
			return new JsonErrorResponse(
				'IllegalPlacement',
				'Tiles must be placed in the same row or column to form one word'
			);
		}

		positionedTiles = this.sortPositions(positionedTiles, direction);

		//get beginning of word
		const startPos =
			this.getLowerTile(positionedTiles[0].lower(direction), direction) ||
			positionedTiles[0].clone();

		let word = '';
		let adjacentWords: ReturnType<typeof this.calculateAdjacentWord>[] = [];
		let nextToAlreadyPlacedTile = false;
		const tilesToPlaceOnBoard: PositionedLetterTile[] = [];

		//read the full word and check for errors
		let currentPosition = startPos;
		let endPos = startPos;
		while (currentPosition !== null) {
			const index = positionedTiles.findIndex((tile) =>
				tile.equals(currentPosition)
			);

			//if the tile is in the tiles the player send the position must be null to place it
			if (index >= 0) {
				const tileToBePlaced = positionedTiles.splice(index, 1)[0];

				if (!BoardPosition.isValid(tileToBePlaced)) {
					return new JsonErrorResponse(
						'OutOfBoard',
						'Tile index is out of the boards bounds',
						{
							x: tileToBePlaced.x,
							y: tileToBePlaced.y,
							tile: tileToBePlaced.tile.getChar(),
							size: Board.SIZE,
						}
					);
				}

				//is the tile already taken
				if (this.board.isTileTaken(tileToBePlaced)) {
					return new JsonErrorResponse(
						'BoardPlaceTaken',
						'On the selected indices are already placed tiles',
						{
							x: tileToBePlaced.x,
							y: tileToBePlaced.y,
							tile: tileToBePlaced.tile.getChar(),
							placedTile: this.board
								.getTile(tileToBePlaced)
								.getTile()
								.getChar(),
						}
					);
				}

				//calculate adjacent words in a 90 degrees rotated direction
				try {
					const adjacentWord = this.calculateAdjacentWord(
						tileToBePlaced,
						direction === 'Horizontal' ? 'Vertical' : 'Horizontal'
					);

					if (adjacentWord !== null) {
						adjacentWords.push(adjacentWord);
					}
				} catch (jsonErrorResponse) {
					return jsonErrorResponse;
				}

				word += tileToBePlaced.tile.getChar();
				endPos = currentPosition;
				tilesToPlaceOnBoard.push(tileToBePlaced);
			}
			//if you include a already placed tile in your word
			else {
				const tile = this.board.getTile(currentPosition);

				if (tile === null || !tile.isTaken()) {
					//end of word or gap
					if (positionedTiles.length === 0) {
						//word end
						break;
					} else {
						return new JsonErrorResponse(
							'GapInWord',
							'Word has a gap in it which makes it invalid',
							{
								x: currentPosition.x,
								y: currentPosition.y,
							}
						);
					}
				}

				word += tile.getTile().getChar();
				endPos = currentPosition;
				nextToAlreadyPlacedTile = true;
			}

			//go one higher
			currentPosition = currentPosition.lower(direction, -1);
		}

		if (
			!Dictionary.instance.isWordValid(word) &&
			adjacentWords.length === 0
		) {
			return new JsonErrorResponse(
				'InvalidWord',
				'Word is not a official allowed Scrabble word',
				{ word: word, start: startPos, end: endPos }
			);
		}

		const key = Board.DIRECTION_KEY[direction];
		if (
			this.board.isEmpty() &&
			!(endPos[key] >= Board.CENTER && startPos[key] <= Board.CENTER)
		) {
			return new JsonErrorResponse(
				'NotCentered',
				'First word needs to go through the center position',
				{ centerX: Board.CENTER, centerY: Board.CENTER }
			);
		}

		if (
			!nextToAlreadyPlacedTile &&
			!this.board.isEmpty() &&
			adjacentWords.length === 0
		) {
			return new JsonErrorResponse(
				'NotConnected',
				'Word is not connected to existing words',
				{ word: word }
			);
		}

		//remove tiles from players bench
		if (
			!this.currentBench().hasTiles(
				tilesToPlaceOnBoard.map((wordTile) => wordTile.tile.getChar())
			)
		) {
			return new JsonErrorResponse(
				'TileNotOnHand',
				'Tile or Tiles are missing in your bench to create the word',
				{
					bench: this.currentBench().getBench(),
					tilesTriedToPlace: tilesToPlaceOnBoard,
				}
			);
		}

		if (ghostPlace) {
			return new JsonResponse({
				adjacentWords: adjacentWords.map((adjacentWord) => ({
					...adjacentWord,
					points: this.board.calculatePoints(
						adjacentWord.startPos,
						adjacentWord.endPos,
						tilesToPlaceOnBoard
					),
				})),
				mainWord:
					word.length > 1
						? {
								startPos: startPos,
								endPos: endPos,
								word: word,
								points: this.board.calculatePoints(
									startPos,
									endPos,
									tilesToPlaceOnBoard
								),
						  }
						: {},
			});
		}

		const currentMove = new PlaceMove(this.currentPlayerName());

		tilesToPlaceOnBoard.forEach(
			(positionedTile) =>
				(positionedTile.tile = this.currentBench().useTile(
					positionedTile.tile.getChar()
				))
		);

		//place tiles on the board
		this.board.placeWord(tilesToPlaceOnBoard);
		this.room.log(`placing word ${word}`, false);

		if (word.length > 1) {
			//add the points to the player
			const points = this.board.calculatePoints(startPos, endPos);
			this.currentBench().addPoints(points);

			currentMove.addWord({
				end: endPos,
				start: startPos,
				points: points,
				word: word,
			});
		}

		adjacentWords.forEach((aW) => {
			const points = this.board.calculatePoints(aW.startPos, aW.endPos);
			this.currentBench().addPoints(points);

			currentMove.addWord({
				points: points,
				word: aW.word,
				start: aW.startPos,
				end: aW.endPos,
			});
		});

		this.board.useActiveMultipliers();
		this.nextPlayer(currentMove);

		return new JsonResponse({});
	}

	skip() {
		const move = new SkipMove(this.currentPlayerName());
		this.nextPlayer(move);
	}
}

export default Scrabble;
