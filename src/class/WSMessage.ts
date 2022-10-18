import { WSAction } from '../types/WSAction';

class WSMessage {
	private action: WSAction;
	private content: object;

	constructor(action: WSAction, content: object) {
		this.action = action;
		this.content = content;
	}

	static ToWSMessage(msg: string): WSMessage | null {
		try {
			const json = JSON.parse(msg);

			return new WSMessage(json.action, json.message);
		} catch (err) {
			return null;
		}
	}

	getAction(): WSAction {
		return this.action;
	}

	json() {
		return {
			action: this.action,
			message: this.content,
		};
	}
}

export default WSMessage;
