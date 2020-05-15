const Message = require('./Message');
const autobind = require('auto-bind');

class RequestGameRoomsMessage extends Message {


	constructor(){

		super();

		autobind(this);
	}


}

module.exports = RequestGameRoomsMessage;