
class Message {


	constructor(){

		this.props = {
			version: 1.0
		}
	}


	/**
	 * Left intentionaly unbinded.
	 */
	getName(){
		return this.constructor.name;
	}


	/**
	 * Left intentionaly unbinded.
	 */
	toJSON(){

		this.props.type = this.getName();
		const json = JSON.stringify(this.props);

		return json;
	}

}

module.exports = Message;