type WSAction =
	| 'game:start'
	| 'game:started'
	| 'player:joined'
	| 'player:left'
	| 'message'
	| 'game:next'
	| 'game:state'
	| 'game:move:trade'
	| 'game:move:skip'
	| 'game:move:place';

export default WSAction;
