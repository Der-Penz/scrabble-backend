import LoggerClass from './class/LoggerClass';
import Room from './class/Room';

class GameHandler extends LoggerClass {
	static readonly ROOM_CHECK_TIME = 1000;

	private openRooms: Room[] = [];
	private inactiveRooms: Map<string, number> = new Map();
	static instance: GameHandler = new GameHandler();

	constructor() {
		super('GameHandler');

		setInterval(() => {
			this.openRooms.forEach((room) => {
				if (room.isEmpty()) {
					this.inactiveRooms.set(
						room.getUUID(),
						(this.inactiveRooms.get(room.getUUID()) || 0) + 1
					);

					if (this.inactiveRooms.get(room.getUUID()) > 10) {
						this.deleteRoom(room.getUUID());
					}
				}
			});
		}, GameHandler.ROOM_CHECK_TIME);
	}

	addRoom(room: Room) {
		this.openRooms.push(room);
		this.log(`adding room ${room.getUUID()}`);
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

	getPublicAvailableRooms(): Room[] {
		return this.openRooms.filter(
			(room) => room.isPublic() && !room.isPlaying() && !room.isEnded()
		);
	}
}

export default GameHandler;
