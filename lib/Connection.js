const WebSocket = require('ws');
const autoBind = require('auto-bind');
const events = require('events');



/**
 * Events: closed <Connection>
 */
class Connection extends events.EventEmitter{

	/**
	 * 
	 * @param {WebSocket} socket 
	 */
	constructor(socket){

		super();

		autoBind(this);

		/** @type {WebSocket} */
		this.socket = socket;
		this.socket.addListener('close', this.handleClose);
		this.socket.addListener('message', this.handleMessage);
		this.socket.addListener('error', this.handleError);


		//setTimeout(this.ping, 5000);
	}


	ping(){

		console.log("Sending heartbeat.");
		this.socket.write("Alive?");


		if (!this.destroyed){
			setTimeout(this.ping, 5000);
		}
	}


	/**
	 * 
	 * @param {boolean} hadError 
	 */
	handleClose(hadError){

		console.log("Connection closed.");
		this.emit('closed', this);
	}

	/**
	 * 
	 * @param {Buffer | string} data 
	 */
	handleMessage(message){

		console.log("Recieved data: " + message);

		this.socket.send("Message Recieved!");
	}


	/**
	 * 
	 * @param {Error} error 
	 */
	handleError(error){

		console.log("Connection error: " + error);
		this.close();
	}


	close(){

		console.log("Closing socket.");
		this.handleClose(null);
	}

}

module.exports = Connection;