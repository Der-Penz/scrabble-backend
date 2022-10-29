import Error from '../types/Error';
import JsonResponse from './JsonResponse';

class JsonErrorResponse extends JsonResponse {
	private error: Error;
	private errorMessage: string;

	constructor(error: Error, errorMessage: string, content?: object) {
		super(content);
		this.error = error;
		this.errorMessage = errorMessage;
	}

	json() {
		return {
			error: this.error,
			errorMessage: this.errorMessage,
			content: this.content,
		};
	}
}
export default JsonErrorResponse;
