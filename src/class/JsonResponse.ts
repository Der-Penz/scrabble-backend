class JsonResponse {
	protected content: object;

	constructor(content: object) {
		this.content = content || {};
	}

	json(): object {
		return { content: this.content };
	}

	string() {
		return JSON.stringify(this.json());
	}
}

export default JsonResponse;
