const WebSocket = require('ws');
const autoBind = require('auto-bind');
const events = require('events');
const RequestGameRoomsMessage = require('./messages/RequestGameRoomsMessage');



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
	 * This handles messages for clients that are not allready in game rooms.
	 * 
	 * @param {Buffer | string} data 
	 */
	handleMessage(message){

		console.log("Recieved data: " + message);

		try {
			var msg = JSON.parse(message);
		} catch (err){

			console.error(err);

			this.socket.send(JSON.stringify({error: true, message: "Expected JSON."}));
			this.socket.close();

			return;
		}
		

		if ("method" in msg === false){

			this.socket.send(JSON.stringify({error: true, message: "Expected property \"method\""}));
			this.socket.close();

			return;
		}

		

		const reply = {};
		this.socket.send(reply.toJSON());
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