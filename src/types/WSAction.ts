export type WSAction =
	| 'game:start'
	| 'game:started'

	| 'player:joined'
	| 'player:left'

	| 'message'
    | 'game:next'
	| 'game:state'
