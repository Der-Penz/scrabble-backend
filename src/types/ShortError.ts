type ShortError =
	| 'ClientError'
	| 'Server Error'
	| 'Unauthorized'
	| 'GameRunning'
	| 'Invalid Code';

export default ShortError;
