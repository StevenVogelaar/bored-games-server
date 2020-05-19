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
 * 
 * All requests are expected to be json strings that include at least method: <string>.
 */
class Client extends events.EventEmitter {

	/**
	 * 
	 * @param {WebSocket} socket 
	 */
	constructor(socket) {

		super();

		autoBind(this);

		/** @type {WebSocket} */
		this.socket = socket;
		this.registerDefaultSocketListeners();


		// Register new handlers in here. Handlers get called with JSON object and the client instance.
		this.handlers = {
			"startNewGame": this.startNewGame,
			"joinRoom": this.joinRoom
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


	registerDefaultSocketListeners(){

		this.socket.addEventListener('close', this.handleClose);
		this.socket.addEventListener('message', this.handleMessage);
		this.socket.addEventListener('error', this.handleError);
	}

	unregisterDefaultSocketListeners(){

		this.socket.removeEventListener('close', this.handleClose);
		this.socket.removeEventListener('message', this.handleMessage);
		this.socket.removeEventListener('error', this.handleError);
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
	 * @param {MessageEvent} message
	 */
	handleMessage(message) {

		console.log("Recieved data: " + message.data);

		try {
			var msg = JSON.parse(message.data);
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

			try {
				this.handlers[msg.method](msg);
			} catch (err){
				console.error(err);
				this.socket.send(JSON.stringify({ error: true, message: "Error has occured." }));
				this.socket.close();
			}
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
		this.socket.close();
		//this.handleClose(null);
	}


	// WebSocket API call handlers ===========


	async startNewGame(msg) {

		console.log("startNewGame");

		try {
			const roomID = await GameService.createGameRoom();

			console.log("ASDASFASFASF: " + roomID);

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


	async joinRoom(msg){

		if ("roomID" in msg === false) throw Error('JSON object must contained property "roomID".');

		GameService.joinGameRoom(msg.roomID, this);
	}


	// =======================================
}

module.exports = Client;