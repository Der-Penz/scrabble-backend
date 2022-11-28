abstract class Move {
	private owner: string;
	private timestamp: number;

	constructor(owner: string) {
		this.owner = owner;
		this.timestamp = Date.now();
	}

	getTimestamp() {
		return this.timestamp;
	}

	getPlacer() {
		return this.owner;
	}
}

export default Move;
