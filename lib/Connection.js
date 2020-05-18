const WebSocket = require('ws');
const autoBind = require('auto-bind');
const events = require('events');
const RequestGameRoomsMessage = require('./messages/RequestGameRoomsMessage');
const GameService = require('./GameService');



/**
 * Events: closed <Connection>
 * 
 * 
 * All response messages will be json strings, with at least error: <boolean> and message: <string> set.
 */
class Connection extends events.EventEmitter {

	/**
	 * 
	 * @param {WebSocket} socket 
	 */
	constructor(socket) {

		super();

		autoBind(this);

		/** @type {WebSocket} */
		this.socket = socket;
		this.socket.addListener('close', this.handleClose);
		this.socket.addListener('message', this.handleMessage);
		this.socket.addListener('error', this.handleError);


		// Register new handlers in here. Handlers get called with JSON object.
		this.handlers = {
			"startNewGame": this.startNewGame,
		};

		//setTimeout(this.ping, 5000);
	}


	ping() {

		console.log("Sending heartbeat.");
		this.socket.write("Alive?");


		if (!this.destroyed) {
			setTimeout(this.ping, 5000);
		}
	}


	/**
	 * 
	 * @param {boolean} hadError 
	 */
	handleClose(hadError) {

		console.log("Connection closed.");
		this.emit('closed', this);
	}

	/**
	 * This handles messages for clients that are not allready in game rooms.
	 * 
	 * @param {Buffer | string} data 
	 */
	handleMessage(message) {

		console.log("Recieved data: " + message);

		try {
			var msg = JSON.parse(message);
		} catch (err) {

			console.error(err);

			this.socket.send(JSON.stringify({ error: true, message: "Expected JSON." }));
			this.socket.close();

			return;
		}

		if ("method" in msg === false) {

			this.socket.send(JSON.stringify({ error: true, message: "Expected property \"method\"" }));
			this.socket.close();

			return;
		}


		if (msg.method in this.handlers === false) {
			this.socket.send(JSON.stringify({ error: true, message: "Invalid method \"" + msg.method + "\"" }));
			this.socket.close();
		} else {
			this.handlers[msg.method](msg);
		}
	}


	/**
	 * 
	 * @param {Error} error 
	 */
	handleError(error) {

		console.log("Connection error: " + error);
		this.close();
	}


	close() {

		console.log("Closing socket.");
		this.handleClose(null);
	}


	// WebSocket API call handlers ===========
	async startNewGame(msg) {

		console.log("startNewGame");

		try {
			const roomID = GameService.createGameRoom();

			var resp = JSON.stringify({
				error: false,
				message: "Succesfully created a new room.",
				roomID: roomID
			});

		} catch (err) {
			console.error(err);
			
			var resp = JSON.stringify({
				error: true,
				message: "Internal error.",
			});
		}

		this.socket.send(resp);
		this.socket.close();
	}


	// =======================================
}

module.exports = Connection;