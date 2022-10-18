import LoggerClass from './class/LoggerClass';
import Room from './class/Room';

class GameHandler extends LoggerClass {
	private openRooms: Room[] = [];
	static instance: GameHandler = new GameHandler();

	constructor() {
		super('GameHandler');
	}

	addRoom(room: Room) {
		this.openRooms.push(room);
		this.log(`addding room ${room.getUUID()}`);
	}

	deleteRoom(roomID: string, delay: number = 0) {
		setTimeout(() => {
			const roomIndex = this.openRooms.findIndex(
				(room) => room.getUUID() === roomID
			);

			if (roomIndex == undefined) {
				return;
			}
			this.openRooms.splice(roomIndex, 1);

			this.log(`deleting room ${roomID}`);
		}, delay);
	}

	getRoom(roomID: string): Room {
		return this.openRooms.find((room) => room.getUUID() === roomID);
	}
}

export default GameHandler;
