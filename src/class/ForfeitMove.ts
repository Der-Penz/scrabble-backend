import Move from './Move';

class ForfeitMove extends Move {

	private forfeiter: string;

	constructor(owner: string, forfeiter: string) {
		super(owner, 'Forfeit');
		this.forfeiter = forfeiter;
	}

	getForfeiter(): string {
		return this.forfeiter;
	}
}

export default ForfeitMove;
