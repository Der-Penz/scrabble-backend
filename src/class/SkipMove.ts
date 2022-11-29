import Move from './Move';

class SkipMove extends Move {
	constructor(owner: string) {
		super(owner, 'Skip');
	}
}

export default SkipMove;
