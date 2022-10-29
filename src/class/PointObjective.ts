import BaseObjective from './BaseObjective';
import Scrabble from './Scrabble';

class PointObjective extends BaseObjective {
	private pointsToWin: number;

	constructor(pointsToWin: number = 100) {
		super();
		this.pointsToWin = pointsToWin;
	}

	checkForGameEnd(currentGame: Scrabble): boolean {
		const someoneMoreThanPointsToWin = [
			...currentGame.getBenches().values(),
		].some((bench) => bench.getPoints() >= this.pointsToWin);

		if (someoneMoreThanPointsToWin) {
			return true;
		}
		return super.checkForGameEnd(currentGame);
	}
}

export default PointObjective;
