import { v4 as uuid } from 'uuid';
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

	private roomID: string;
	private host: string;
	private paused: boolean;
	private players: Map<Websocket, string>;
	private playerCount: number;
	private socketTokens: Map<string, string>;
	private gameState: GameState;
	private scrabbleGame: Scrabble | null;
	private visibility: RoomVisibility;

	constructor(roomID: string = uuid(), visibility: RoomVisibility) {
		super(`Room.${roomID}`);
		this.roomID = roomID;
		this.gameState = 'waiting';
		this.players = new Map();
		this.socketTokens = new Map();
		this.scrabbleGame = null;
		this.host = undefined;
		this.playerCount = 0;
		this.paused = false;
		if (visibility === 'PRIVATE' || visibility === 'PUBLIC') {
			this.visibility = visibility;
		} else {
			this.visibility = 'PUBLIC';
		}
	}

	joinRoom(ws: Websocket, name: string, socketToken?: string) {
		if (this.gameState === 'playing' && socketToken) {
			const formerName = this.socketTokens.get(socketToken);
			if (formerName) {
				this.players.set(ws, formerName);
				this.sendMessage(
					new WSMessage('player:self', {
						name: formerName,
						host: this.host === formerName,
						socketToken,
					}),
					formerName
				);
				return true;
			}
		}

		if (
			this.gameState !== 'waiting' ||
			this.isFull() ||
			this.hasName(name)
		) {
			return false;
		}

		this.log(`${name} joined room`);

		if (!this.host) {
			this.host = name;
		}

		const newSocketToken = uuid();
		this.socketTokens.set(newSocketToken, name);

		this.broadcastMessage(
			new WSMessage('player:joined', { name, host: this.host === name })
		);
		this.players.set(ws, name);
		this.playerCount = this.players.size;

		this.players.forEach((pName, _) => {
			if (pName === name) {
				this.sendMessage(
					new WSMessage('player:self', {
						name,
						host: this.host === name,
						socketToken: newSocketToken,
					}),
					name
				);
			} else {
				this.sendMessage(
					new WSMessage('player:joined', {
						name: pName,
						host: this.host === pName,
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
		if (!this.isPlaying()) {
			this.socketTokens.forEach((value, key) => {
				if (value === name) {
					this.socketTokens.delete(key);
					this.playerCount = this.players.size;
				}
			});
		}

		this.broadcastMessage(
			new WSMessage('player:left', { name, host: this.host === name })
		);

		if (this.isPlaying() && this.playerCount !== this.players.size) {
			this.pauseGame();
		}

		//terminate if host leaves in lobby
		if (this.isWaiting() && this.host === name) {
			this.broadcastMessage(
				new WSMessage('game:closed', {
					reason: 'host left the game',
				})
			);
			this.forceLeave();
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
		if (this.isPlaying() || this.isEnded()) return this;

		this.gameState = 'playing';
		this.scrabbleGame = new Scrabble(
			this,
			[...this.players.values()],
			objective
		);

		this.sendStartState();

		return this;
	}

	private pauseGame() {
		if (this.isPaused() || this.isEnded()) {
			return;
		}

		this.paused = true;
		this.log('pausing game');
		const MESSAGE_INTERVAL_TIME = 5 as const;
		const TIME_TILL_FORCE_CLOSE = 20 as const;
		let passedTime = 0;
		this.broadcastMessage(
			new WSMessage('game:paused', {
				time: TIME_TILL_FORCE_CLOSE - passedTime,
			})
		);
		const interval = setInterval(() => {
			passedTime += MESSAGE_INTERVAL_TIME;

			//if player joined again restart
			if (this.playerCount === this.players.size) {
				this.sendStartState();
				this.paused = false;
				clearInterval(interval);
				return;
			}

			this.broadcastMessage(
				new WSMessage('game:paused', {
					time: TIME_TILL_FORCE_CLOSE - passedTime,
				})
			);

			if (passedTime >= TIME_TILL_FORCE_CLOSE) {
				this.log('closing room because of left player');
				this.broadcastMessage(
					new WSMessage('game:closed', {
						reason: 'not all player were present in the game',
					})
				);

				clearInterval(interval);
				this.forceLeave();
				this.gameState = 'ended';
			}
		}, MESSAGE_INTERVAL_TIME * 1000);
	}

	private forceLeave() {
		this.players.forEach((value, key) => {
			this.log(`${value} forced to leave room`);
			key.close();
			this.players.delete(key);
		});
	}

	private sendStartState() {
		const objective = this.getGame().getObjective();
		const minutes =
			objective instanceof TimeObjective ||
			objective instanceof SeparatedTimeObjective
				? objective.getTime()
				: 0;
		const points =
			objective instanceof PointObjective
				? objective.getPointsToWin()
				: 0;

		this.broadcastMessage(
			new WSMessage('game:started', {
				objectiveType: objective.getType(),
				minutes: minutes,
				points: points,
			})
		);

		this.getGame()
			.getBenches()
			.forEach((bench, name) => {
				this.sendMessage(
					new WSMessage('game:next', {
						benchOwner: name,
						bench: bench,
					}),
					name
				);
			});

		this.getGame().broadcastGameState();
	}

	getUUID(asJoinUrl?: boolean) {
		return asJoinUrl
			? `${process.env.URL}:${process.env.PORT}/ws/${this.roomID}`
			: this.roomID;
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

	isPlaying() {
		return this.gameState === 'playing';
	}

	isEnded() {
		return this.gameState === 'ended';
	}

	isWaiting() {
		return this.gameState === 'waiting';
	}

	isPaused() {
		return this.paused;
	}

	getGameState() {
		return this.gameState;
	}
}

export default Room;
