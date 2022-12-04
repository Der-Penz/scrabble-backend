type ShortError =
	| 'ClientError'
	| 'ServerError'
	| 'Unauthorized'
	| 'GameRunning'
	| 'RoomNotExisting'
	| 'Invalid Code';

export default ShortError;
