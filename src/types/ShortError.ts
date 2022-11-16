type ShortError =
	| 'ClientError'
	| 'Server Error'
	| 'Unauthorized'
	| 'GameRunning'
	| 'RoomNotExisting'
	| 'Invalid Code';

export default ShortError;
