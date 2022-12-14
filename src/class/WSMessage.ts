import WSAction from '../types/WSAction';

class WSMessage {
	private action: WSAction;
	private content: any;

	constructor(action: WSAction, content: any) {
		this.action = action;
		this.content = content;
	}

	static ToWSMessage(msg: string): WSMessage | null {
		try {
			const json = JSON.parse(msg);

			return new WSMessage(json.action, json.message);
		} catch (err) {
			console.error('error during ws message parsing');
			console.error(err);
			return null;
		}
	}

	getAction(): WSAction {
		return this.action;
	}

	getContent(): any {
		return this.content;
	}

	hasContent() {
		return this.content !== null && this.content !== undefined;
	}

	json() {
		return {
			action: this.action,
			message: this.content,
		};
	}
}

export default WSMessage;
