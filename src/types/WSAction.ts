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

export default WSAction;
