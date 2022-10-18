import Char from '../types/Char';
import Bag from './Bag';
import Bench from './Bench';
import Board from './Board';
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

	placeWord() {}

	skip() {
		this.nextPlayer();
	}
}

export default Scrabble;
