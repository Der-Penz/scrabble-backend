import Room from '../class/Room';
import WSMessage from '../class/WSMessage';

type WSAction =
	| 'game:start'
	| 'game:started'
	| 'game:end'
	| 'player:joined'
	| 'player:left'
	| 'player:self'
	| 'message'
	| 'game:next'
	| 'game:state'
	| 'game:move:trade'
	| 'game:move:skip'
	| 'game:move:place'
	| 'game:move:ghost'
	| 'game:move:forfeit';

export interface Action {
	readonly action: WSAction;
	readonly needsStartedGame: boolean;
	readonly needsActivePlayer: boolean;

	execute(
		room: Room,
		name: string,
		incomingMessage: WSMessage
	): WSMessage | null;
}

export default WSAction;
