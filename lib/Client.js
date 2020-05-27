const WebSocket = require('ws');
const autoBind = require('auto-bind');
const events = require('events');
const RequestGameRoomsMessage = require('./messages/RequestGameRoomsMessage');
const GameService = require('./GameService');
const RoomFullError = require('./Errors/RoomFullError');



/**
 * Events: 	closed(<Client>)
 * 			message(<Client>, <MessageEvent>)
 * 				notes: listening to this event disables the Client's built in message listener.
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

	/*
	unregisterDefaultSocketListeners(){

		//this.socket.removeEventListener('close', this.handleClose);
		//this.socket.removeEventListener('message', this.handleMessage);
		this.socket.removeEventListener('error', this.handleError);
	}*/


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

		if (this.listeners('message').length > 0){
			this.emit('message', this, message); // TODO: Better way to plug in message processors?
			return;
		}

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
				this.socket.send(JSON.stringify({ error: true, message: "An error has occured." }));
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


	/**
	 * 
	 * @param {Object} msg 
	 * 		{password:<String} // String can be empty
	 * 
	 */
	async startNewGame(msg) {

		console.log("startNewGame");

		if ("password" in msg === false){
			msg.password = "";
		}

		if ("type" in msg === false){
			this.socket.send(JSON.stringify({error: true, message: '"type" was not specified.'}));
			this.socket.close();
			return;
		}

		if (GameService.getValidGameTypes().includes(msg.type) === false){

			this.socket.send(JSON.stringify({error: true, message: 'Invalid game type.'}));
			this.socket.close();
			return;
		}

		try {

			const roomID = await GameService.createGameRoom(msg.type, msg.password);

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


	/**
	 * 
	 * @param {Object} msg 
	 * 		Expected:
	 * 			{roomID:<String>, password:<String>}
	 * 
	 */
	async joinRoom(msg){

		if ("roomID" in msg === false){

			this.socket.send(JSON.stringify({error: true, message:'Must include property "roomID".'}));
			this.socket.close();
			return;
		}

		if ("password" in msg === false) msg.password = "";

		try {

			GameService.joinGameRoom(msg.roomID, this);

		} catch (err){
			if (err instanceof RoomFullError){
				this.socket.send(JSON.stringify({error: true, message:"The game room you were trying join is full."}));
				this.socket.close();
			} else {
				throw err;
			}
		}
	}


	// =======================================
}

module.exports = Client;