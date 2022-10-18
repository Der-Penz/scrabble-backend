import Websocket from 'ws';
import { v4 } from 'uuid';
import Scrabble from './Scrabble';
import WSMessage from './WSMessage';
import LoggerClass from './LoggerClass';
import { Gamestate } from '../types/Gamestate';

export default class Room extends LoggerClass {
	private uuid: string;
	private host: string;
	private players: Map<Websocket, string>;
	private gamestate: Gamestate;
	private scrabbleGame: Scrabble | null;

	constructor(uuid: string = v4()) {
		super(`Room.${uuid}`);
		this.uuid = uuid;
		this.gamestate = 'waiting';
		this.players = new Map();
		this.scrabbleGame = null;
	}

	joinRoom(ws: Websocket, name: string) {
		this.log(`${name} joined room`);

		if (!this.host) {
			this.host = name;
		}

		this.broadcastMessage(new WSMessage('player:joined', { name }));
		this.players.set(ws, name);
	}

	leaveRoom(ws: Websocket): boolean {
		if (!this.players.has(ws)) {
			return this.players.size === 0;
		}

		const name = this.players.get(ws);

		this.log(`${name} left room`);

		this.broadcastMessage(new WSMessage('player:left', { name }));
		this.players.delete(ws);

		//terminate game for now if one player left
		if (this.gamestate === 'playing') {
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

		this.getWs(name).send(stringMessage);

		return this;
	}

	startGame(): Room {
		if (this.gamestate === 'playing') return this;

		this.gamestate = 'playing';
		this.scrabbleGame = new Scrabble(this, [...this.players.values()]);
		this.broadcastMessage(new WSMessage('game:started', {}));
		this.getGame().skip();

		return this;
	}

	getUUID(asJoinUrl?: boolean) {
		return asJoinUrl
			? `${process.env.URL_WS}:${process.env.PORT}/ws/${this.uuid}`
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

	isEmpty(): boolean {
		return this.players.size === 0;
	}

	getWs(name: string): Websocket | null {
		let ws: Websocket | null;
		this.players.forEach((value, key) => {
			if (value === name) {
				ws = key;
			}
		});

		return ws;
	}

	isStarted(): boolean {
		return this.gamestate === 'playing';
	}
}
