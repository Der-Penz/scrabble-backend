import Bench from './Bench';
import Scrabble from './Scrabble';

class BaseObjective {
	constructor() {}

	checkForGameEnd(currentGame: Scrabble) {
		if (currentGame.getBag().getCount() === 0) {
			return true;
		}

		return false;
	}

	calculateWinner(benches : Map<string, Bench>){
		const players = {};
		const winner = { name: '', points: 0 };
		benches.forEach((bench, name) => {
			players[name] = bench.getPoints();
			if (bench.getPoints() > winner.points) {
				winner.points = bench.getPoints();
				winner.name = bench.getOwner();
			}
		});

		return {players, winner}
	}
}

export default BaseObjective;
