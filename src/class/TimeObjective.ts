import BaseObjective from './BaseObjective';
import Scrabble from './Scrabble';

class TimeObjective extends BaseObjective {
	private timeToPlay: number;
	private startTime: number;

	constructor(millisToPlay: number) {
		super();
		this.type = 'TIME';
		this.startTime = Date.now();
		this.timeToPlay = millisToPlay;
	}

	static SECONDS_TO_MILLIS(seconds: number) {
		return seconds * 1000;
	}

	static MINUTES_TO_MILLIS(minutes: number) {
		return TimeObjective.SECONDS_TO_MILLIS(minutes * 60);
	}

	checkForGameEnd(currentGame: Scrabble): boolean {
		if (this.getLeftTime() <= 0) {
			return true;
		}

		return super.checkForGameEnd(currentGame);
	}

	getTime(){
		return this.timeToPlay;
	}

	getLeftTime(){
		return Math.max((this.timeToPlay + this.startTime) - Date.now(), 0);
	}
}

export default TimeObjective;
