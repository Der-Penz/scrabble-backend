interface JsonResponseType {
	json: () => object;
	string: () => string;
}

export class JsonErrorRespone implements JsonResponseType {
	private error: Error;
	private errorMessage: string;

	constructor(error: Error, errorMessage: string) {
		this.error = error;
		this.errorMessage = errorMessage;
	}

	json() {
		return { error: this.error, errorMessage: this.errorMessage };
	}

	string() {
		return JSON.stringify(this.json());
	}
}

export class JsonResponse implements JsonResponseType {
	private content: object | string;

	constructor(content: object) {
		this.content = content;
	}

	json() {
		return { content: this.content };
	}

	string() {
		return JSON.stringify(this.json());
	}
}
