export function generateRandomDoubleName(): string {
	const names = [
		'funny',
		'old',
		'happy',
		'bloody',
		'brave',
		'clever',
		'crazy',
		'cute',
		'hungry',
		'lucky',
		'powerful',
		'sleepy',
		'tired',
	];
	const lastNames = [
		'frog',
		'crow',
		'falcon',
		'hawk',
		'owl',
		'parrot',
		'penguin',
		'turkey',
		'shark',
		'crab',
		'bee',
		'bear',
		'goat',
		'seal',
		'lizard',
		'chameleon',
	];

	return (
		names[Math.floor(Math.random() * names.length)] +
		' ' +
		lastNames[Math.floor(Math.random() * lastNames.length)]
	);
}
