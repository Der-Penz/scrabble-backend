import BaseObjective from './BaseObjective';
import Scrabble from './Scrabble';

class TimeObjective extends BaseObjective {
	private millisToPlay: number;
	private startTime: number;

	constructor(millisToPlay: number) {
		super();
		this.startTime = Date.now();
		this.millisToPlay = millisToPlay;
	}

	static SECONDS_TO_MILLIS(seconds: number) {
		return seconds * 1000;
	}

	static MINUTES_TO_MILLIS(minutes: number) {
		return TimeObjective.SECONDS_TO_MILLIS(minutes * 60);
	}

	checkForGameEnd(currentGame: Scrabble): boolean {
		if (Date.now() > this.startTime + this.millisToPlay) {
			return true;
		}

		return super.checkForGameEnd(currentGame);
	}

	
}

export default TimeObjective;
