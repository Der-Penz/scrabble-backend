import Bench from './Bench';
import Scrabble from './Scrabble';

class BaseObjective {
	constructor() {}

	checkForGameEnd(currentGame: Scrabble) {
		if (currentGame.getBag().getCount() === 0) {
			if (
				[...currentGame.getBenches().values()].some((bench) =>
					bench.isEmpty()
				)
			) {
				return true;
			}
		}

		return false;
	}

	calculateWinner(benches: Map<string, Bench>) {
		const players = {};
		let winner: { name: string; points: number } = null;
		benches.forEach((bench, name) => {
			const minusPoints = bench.getBench().reduce((minusPoints, tile) => {
				minusPoints += tile.getPoints();
				return minusPoints;
			}, 0);

			const points = bench.getPoints() - minusPoints;

			players[name] = points;

			if (winner === null) {
				winner = { points: points, name: name };
				return;
			}

			if (points > winner.points) {
				winner.points = points;
				winner.name = name;
			}
		});

		return { players, winner };
	}
}

export default BaseObjective;
