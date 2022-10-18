class LoggerClass {
	private name: string;

	constructor(name: string) {
		this.name = name;
	}

	log(msg: string, timestamp: boolean = false) {
        console.log(`${Date.now()}| ${this.name} : ${msg}`)
    }
}

export default LoggerClass;
