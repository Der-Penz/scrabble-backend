import BaseObjective from './BaseObjective';
import Bench from './Bench';
import Scrabble from './Scrabble';

class SeparatedTimeObjective extends BaseObjective {
	private millisToPlay: number;
	private playerPastMillis: Map<string, number>;
	private pastMillisSinceLastSwap: number;

	constructor(millisToPlay: number) {
		super();

		this.millisToPlay = millisToPlay;
		this.pastMillisSinceLastSwap = Date.now();
		this.playerPastMillis = new Map();
	}

	checkForGameEnd(currentGame: Scrabble) {
		const millisToAdd = Date.now() - this.pastMillisSinceLastSwap;

		this.playerPastMillis.set(
			currentGame.currentPlayerName(),
			(this.playerPastMillis.get(currentGame.currentPlayerName()) || 0) +
				millisToAdd
		);

		this.pastMillisSinceLastSwap = Date.now();
		return super.checkForGameEnd(currentGame);
	}

	calculateWinner(benches: Map<string, Bench>) {
		const { players: oldPlayers } =
			super.calculateWinner(benches);

		const players = {};
		const winner = { name: '', points: 0 };
		benches.forEach((bench, name) => {
			let points = oldPlayers[name];

			if (this.playerPastMillis.get(name) > this.millisToPlay) {
				const difference =
					this.playerPastMillis.get(name) - this.millisToPlay;

				//minus point for every 15 more seconds the player needed
				points -= Math.floor(difference / 1000 / 15 + 1);
			}

			players[name] = points;
			if (points > winner.points) {
				winner.points = points;
				winner.name = bench.getOwner();
			}
		});

		return { players, winner };
	}
}

export default SeparatedTimeObjective;
