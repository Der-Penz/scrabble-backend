import { v4 } from 'uuid';
import Websocket from 'ws';
import GameState from '../types/GameState';
import { RoomVisibility } from '../types/RoomVisibility';
import BaseObjective from './BaseObjective';
import LoggerClass from './LoggerClass';
import PointObjective from './PointObjective';
import Scrabble from './Scrabble';
import SeparatedTimeObjective from './SeparatedTimeObjective';
import TimeObjective from './TimeObjective';
import WSMessage from './WSMessage';
class Room extends LoggerClass {
	static MAX_PLAYERS = 4;

	private uuid: string;
	private host: string;
	private players: Map<Websocket, string>;
	private gameState: GameState;
	private scrabbleGame: Scrabble | null;
	private visibility: RoomVisibility;

	constructor(uuid: string = v4(), visibility: RoomVisibility) {
		super(`Room.${uuid}`);
		this.uuid = uuid;
		this.gameState = 'waiting';
		this.players = new Map();
		this.scrabbleGame = null;
		this.host = undefined;
		if (visibility === 'PRIVATE' || visibility === 'PUBLIC') {
			this.visibility = visibility;
		} else {
			this.visibility = 'PUBLIC';
		}
	}

	joinRoom(ws: Websocket, name: string) {
		if (this.gameState !== 'waiting' || this.isFull()) {
			return false;
		}

		this.log(`${name} joined room`);

		if (!this.host) {
			this.host = name;
		}

		this.broadcastMessage(
			new WSMessage('player:joined', { name, host: this.host === name })
		);
		this.players.set(ws, name);
		this.players.forEach((playerName, _) => {
			if (playerName === name) {
				this.sendMessage(
					new WSMessage('player:self', {
						name,
						host: this.host === name,
					}),
					name
				);
			} else {
				this.sendMessage(
					new WSMessage('player:joined', {
						name: playerName,
						host: this.host === playerName,
					}),
					name
				);
			}
		});

		return true;
	}

	leaveRoom(ws: Websocket): boolean {
		if (!this.players.has(ws)) {
			return this.players.size === 0;
		}

		const name = this.getPlayer(ws);
		this.log(`${name} left room`);

		this.players.delete(ws);

		this.broadcastMessage(
			new WSMessage('player:left', { name, host: this.host === name })
		);

		//terminate game for now if one player left
		if (this.gameState === 'playing' || this.host === name) {
			this.players.forEach((value, key) => {
				this.log(`${value} forced to leave room`);
				key.close();
				this.players.delete(key);
			});
		}

		return this.players.size === 0;
	}

	broadcastMessage(msg: WSMessage, exclude?: Websocket): Room {
		const stringMessage = JSON.stringify(msg.json());

		this.players.forEach((name, ws) => {
			if (exclude === ws) return;
			ws.send(stringMessage);
		});

		return this;
	}

	sendMessage(msg: WSMessage, name: string): Room {
		const stringMessage = JSON.stringify(msg.json());

		this.getWs(name)?.send(stringMessage);

		return this;
	}

	startGame(objective: BaseObjective): Room {
		if (this.gameState === 'playing') return this;

		this.gameState = 'playing';
		this.scrabbleGame = new Scrabble(
			this,
			[...this.players.values()],
			objective
		);

		let minutes = 0;
		let points = 0;
		if (objective instanceof TimeObjective) {
			minutes = objective.getTime();
		}
		if (objective instanceof SeparatedTimeObjective) {
			minutes = objective.getTime();
		}
		if (objective instanceof PointObjective) {
			points = objective.getPointsToWin();
		}

		this.broadcastMessage(
			new WSMessage('game:started', {
				objectiveType: objective.getType(),
				minutes: minutes,
				points: points,
			})
		);

		this.scrabbleGame.getBenches().forEach((bench, name) => {
			this.sendMessage(
				new WSMessage('game:next', {
					benchOwner: name,
					bench: bench,
				}),
				name
			);
		});

		this.scrabbleGame.broadcastGameState();

		return this;
	}

	getUUID(asJoinUrl?: boolean) {
		return asJoinUrl
			? `${process.env.URL}:${process.env.PORT}/ws/${this.uuid}`
			: this.uuid;
	}

	getGame(): Scrabble {
		return this.scrabbleGame;
	}

	getHost(): string {
		return this.host;
	}

	getPlayer(ws: Websocket): string {
		return this.players.get(ws);
	}

	getPlayerCount() {
		return this.players.size;
	}

	isEmpty(): boolean {
		return this.players.size === 0;
	}

	isFull() {
		return this.players.size === Room.MAX_PLAYERS;
	}

	isPublic() {
		return this.visibility === 'PUBLIC';
	}

	hasName(name: string) {
		return this.getWs(name) !== null;
	}

	getWs(name: string): Websocket | null {
		let ws: Websocket | null = null;
		this.players.forEach((value, key) => {
			if (value === name) {
				ws = key;
			}
		});

		return ws;
	}

	isStarted() {
		return this.gameState === 'playing';
	}

	hasEnded() {
		return this.gameState === 'ended';
	}

	getGameState() {
		return this.gameState;
	}
}

export default Room;
