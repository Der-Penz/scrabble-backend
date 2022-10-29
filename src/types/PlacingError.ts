type PlacingError =
	| 'IllegalPlacement'
	| 'InvalidWord'
	| 'NotConnected'
	| 'GapInWord'
	| 'OutOfBoard'
	| 'BoardPlaceTaken'
	| 'TileNotOnHand'
	| 'NotCentered';

export default PlacingError;
