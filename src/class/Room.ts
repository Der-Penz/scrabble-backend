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
	static readonly MAX_PLAYERS = 4 as const;

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
		this.visibility = Math.min(0, Math.max(1, visibility));
	}

	joinRoom(ws: Websocket, name: string, socketToken?: string) {
		//reconnecting
		if (this.isPlaying() && this.socketTokens.has(socketToken)) {
			const formerName = this.socketTokens.get(socketToken);
			this.players.set(ws, formerName);
			sendPlayerInfoToPlayer.call(this, formerName, socketToken);
			return true;
		}

		//block joining for new player on running game, full game or existing name
		if (!this.isWaiting() || this.isFull() || this.hasName(name)) {
			return false;
		}

		if (!this.host) {
			this.host = name;
		}

		const newSocketToken = `${this.getUUID()}:${Math.random()
			.toString(16)
			.substring(10)}`;
		this.socketTokens.set(newSocketToken, name);

		this.broadcastMessage(
			new WSMessage('player:joined', { name, host: this.host === name })
		);
		this.players.set(ws, name);
		this.playerCount = this.players.size;

		sendPlayerInfoToPlayer.call(this, name, newSocketToken);

		return true;

		function sendPlayerInfoToPlayer(name: string, socketToken: string) {
			this.players.forEach((pName, _) => {
				if (pName === name) {
					this.sendMessage(
						new WSMessage('player:self', {
							name,
							host: this.host === name,
							socketToken,
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

			return;
		}
	}

	leaveRoom(ws: Websocket): boolean {
		if (!this.players.has(ws)) {
			return this.players.size === 0;
		}

		const name = this.getPlayer(ws);

		this.players.delete(ws);
		if (this.isWaiting()) {
			this.socketTokens.forEach((tokenName, token) => {
				if (tokenName === name) {
					this.socketTokens.delete(token);
					this.playerCount = this.players.size;
				}
			});

			//terminate if host leaves
			if (this.host === name) {
				this.broadcastMessage(
					new WSMessage('game:closed', {
						reason: 'host left the game',
					})
				);
				this.forceLeave();
			}
		}

		this.broadcastMessage(
			new WSMessage('player:left', { name, host: this.host === name })
		);

		if (this.isPlaying() && this.playerCount !== this.players.size) {
			this.pauseGame();
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
		if (!this.isWaiting()) {
			return this;
		}
		if (this.playerCount <= 1) {
			return this;
		}

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

		const TIME_TILL_FORCE_CLOSE = 60 as const;
		const MESSAGE_INTERVAL_TIME = 5 as const;
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
				clearInterval(interval);
				this.sendStartState();
				this.paused = false;
				return;
			}

			this.broadcastMessage(
				new WSMessage('game:paused', {
					time: TIME_TILL_FORCE_CLOSE - passedTime,
				})
			);

			if (passedTime >= TIME_TILL_FORCE_CLOSE) {
				clearInterval(interval);
				this.broadcastMessage(
					new WSMessage('game:closed', {
						reason: 'time for player to reconnect ran out',
					})
				);

				this.forceLeave();
				this.gameState = 'ended';
			}
		}, MESSAGE_INTERVAL_TIME * 1000);
	}

	private forceLeave() {
		this.socketTokens.clear();
		this.players.forEach((value, key) => {
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
		return this.visibility === RoomVisibility.Public;
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
