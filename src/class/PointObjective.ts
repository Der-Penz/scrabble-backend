import BaseObjective from './BaseObjective';
import Scrabble from './Scrabble';

class PointObjective extends BaseObjective {
	private pointsToWin: number;

	static readonly DEFAULT_POINTS = 50;

	constructor(pointsToWin: number = PointObjective.DEFAULT_POINTS) {
		super();

		this.type = 'POINT';
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

	getPointsToWin() {
		return this.pointsToWin;
	}
}

export default PointObjective;
