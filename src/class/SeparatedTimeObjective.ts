import BaseObjective from './BaseObjective';
import Bench from './Bench';
import Scrabble from './Scrabble';

class SeparatedTimeObjective extends BaseObjective {
	private timeToPlay: number;
	private playerPastMillis: Map<string, number>;
	private pastMillisSinceLastSwap: number;

	constructor(millisToPlay: number) {
		super();

		this.type = 'SEPARATED_TIME';
		this.timeToPlay = millisToPlay;
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

	calculateWinner(benches: Map<string, Bench>, surrenderer?: string) {
		const { players: oldPlayers } = super.calculateWinner(benches);

		const players = {};
		let winner: { name: string; points: number } = null;
		benches.forEach((bench, name) => {
			let points = oldPlayers[name];

			if (this.playerPastMillis.get(name) > this.timeToPlay) {
				const difference =
					this.playerPastMillis.get(name) - this.timeToPlay;

				//minus point for every 15 more seconds the player needed
				points -= Math.floor(difference / 1000 / 15 + 1);
			}

			players[name] = points;

			if(surrenderer === name){
				return;
			}

			if (winner === null) {
				winner = { points: points, name: name };
				return;
			}

			if (points > winner.points) {
				winner.points = points;
				winner.name = bench.getOwner();
			}
		});

		return { players, winner };
	}

	getTime() {
		return this.timeToPlay;
	}

	getLeftTime(who: string) {
		if (this.playerPastMillis.has(who)) {
			return this.timeToPlay - this.playerPastMillis.get(who)!;
		} else {
			return this.timeToPlay;
		}
	}
}

export default SeparatedTimeObjective;
