import Bag from './Bag';
import Bench from './Bench';
import Board from './Board';
import Room from './Room';
import WSMessage from './WSMessage';

class Scrabble {
	private board: Board;
	private benches: Map<string, Bench> = new Map();
	private currentPlayer = 0;
	private bag: Bag;
	private room: Room;

	constructor(
		room: Room,
		players: string[],
		fillMap?: string
	) {
		this.board = new Board();
		this.bag = new Bag(fillMap);
		this.room = room;

		players.forEach((player) =>
			this.benches.set(player, new Bench(player, this.bag.drawMany(1)))
		);
	}

	private currentPlayerName(): string {
		return [...this.benches.keys()][this.currentPlayer];
	}

	nextPlayer() {
		this.currentPlayer = (this.currentPlayer + 1) % this.benches.size;

		const bench = this.benches.get(this.currentPlayerName());
		const playerName = this.currentPlayerName();

		while (!bench.isFull()) {
			bench.addTile(this.bag.drawOne());
		}

		//send new bench to only the player
		this.room.sendMessage(
			new WSMessage('game:next', {
				currentPlayer: playerName,
				bench: bench,
			}),
			playerName
		);

		//send all the new board and the bag
		this.room.broadcastMessage(new WSMessage('game:state', {
			bag: this.bag,
			board: this.board.getBoard(),
			currentPlayer: playerName,
		}));
	}

	drawTile(): boolean {
		const playerName = [...this.benches.keys()][this.currentPlayer];

		if (this.benches.get(playerName).isFull()) {
			return false;
		}
		this.benches.get(playerName).addTile(this.bag.drawOne());

		return true;
	}
}

export default Scrabble;
