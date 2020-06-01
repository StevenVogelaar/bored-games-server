const Client = require('../Client');
const events = require('events');
const autoBind = require('auto-bind');
const RoomFullError = require('../Errors/RoomFullError');
const Logic = require('../GameLogic/Logic');
const CheckersLogic = require('../GameLogic/CheckersLogic');

const CLIENT_TIMEOUT = 12000;
const HEART_BEAT_INTERVAL = 5000;
const ROOM_CLEANUP_TIMEOUT = 300000;
const MAX_CLIENTS = 2;

/**
 * Events: close <String>  --- Called with roomID
 * 
 * 
 * 
 * 
 * 
 * Message method types:
 * 
 * - heartBeat - 
 * 		(server) request:	{error: false, method: 'heartBeat', id: <Number>}
 * 		(client) response: 	{error: false, method: 'heartBeat', id: <Number>}
 * 
 * - piecePlaced -
 * 		(client) request: 	{error: false, method: 'piecePlaced', id: <Number>, oX: <Number>, oY: <Number>, dX: <Number>, dY: <Number>}
 * 		(server) response:	{error: false, method: 'piecePlaced', id: <Number>, oX: <Number>, oY: <Number>, dX: <Number>, dY: <Number>}
 * 					// The resposne gets sent to all clients (except the one that made the request). May have 'error: true' and a message specifying the error
 * 					// if the move was invalid.
 * 					// 'id' refers to the piece id.
 * 		(server) response:	{error: true, method: 'invalidMove', pieceID: <Number>, oX, pieceID: <Number> oY, pieceID: <NumbeR>, dX, pieceID: <Number> dY}
 * 					// the coordinates are of the original invald move.
 * 
 * - getGameState -
 * 		(client) request: 	{error: false, method: 'getGameState'}
 * 		(server) response:	{error: false, method:'stateRefresh', gameState: <Object>}
 * 					// Exact contents of gameState will depend on the game type.
 * 					// See the Logic class for the game type you are interested in.
 * 
 * - pieceMoved - 
 * 		(client) request: 	{error: false, method: 'pieceMoved', squareID: <Number>, x: <Number>, y: <Number>}
 * 		(server) response: 	{error: false, method: 'pieceMoved', squareID: <Number>, x: <Number>, y: <Number>}
 * 					// Response gets sent to all clients (except the one that made the request).
 * 		(server) response: 	{error: true, method: 'pieceDoesNotExist', id: <Number>}
 * 					// If the piece with the specified id does not exist.
 * 		
 * 
 * 
 * 
 * 
 */
class Room extends events.EventEmitter {

	/**
	 * 
	 * @param {String} roomID 
	 */
	constructor(roomID) {

		super();
		autoBind(this);

		console.log("Creating room with id: " + roomID);

		this.logic = new CheckersLogic();

		this.roomID = roomID;

		/**
		 * Object of objects in the form:
		 * {
		 * 		id: {id:<Number>, lastHResponse: <Number>, client: <Client>},
		 * 			.
		 * 			.
		 * 			.
		 * 		id: {id:<Number>, lastHResponse: <Number>, client: <Client>}
		 * }
		 */
		this.clients = {};

		this.numClients = 0;
		this.nextClientID = 0; // Incremented every time a client joins, used as a client id for heartbeats.
		this.heartBeatTimeOut = setTimeout(this.heartBeat, HEART_BEAT_INTERVAL);
		this.cleanupTimeOut = null;
	}


	/**
	 * 
	 * @param {Client} client
	 */
	addClient(client) {

		if (this.numClients >= MAX_CLIENTS) {
			throw new RoomFullError("Room is full.");
		}


		client.once('closed', this.handleClientClose); // no need to remove woo.
		client.addListener('message', this.handleMessage);

		const id = this.nextClientID++;
		client.inRoomID = id;
		this.clients[id] = { id: id, lastHResponse: new Date().valueOf(), client: client };
		this.numClients++;

		// Go ahead and send them the current gamestate.
		client.socket.send(JSON.stringify({ error: false, method: 'stateRefresh', gameState: this.logic.getGameState() }));
		this.stopCleanupTimer();
	}


	cleanupRoom() {

		if (this.numClients === 0) {
			this.close();
			return;
		}

		this.cleanupTimeOut = setTimeout(this.cleanupRoom, ROOM_CLEANUP_TIMEOUT);
	}


	heartBeat() {

		const currentTime = new Date().valueOf();

		for (let id in this.clients) {
			const clientObj = this.clients[id];

			if (currentTime - clientObj.lastHResponse > CLIENT_TIMEOUT) {
				console.log("Closing unresponsive client.");
				clientObj.client.close();
			} else {
				console.log("sending heartbeat");
				clientObj.client.socket.send(JSON.stringify({ error: false, method: "heartBeat", id: clientObj.id }));
			}
		}

		this.heartBeatTimeOut = setTimeout(this.heartBeat, HEART_BEAT_INTERVAL);
	}

	startCleanupTimer() {

		if (this.cleanupTimeOut) {
			clearTimeout(this.cleanupTimeOut);
		}

		this.cleanupTimeOut = setTimeout(this.cleanupRoom, ROOM_CLEANUP_TIMEOUT);
	}

	stopCleanupTimer() {

		if (this.cleanupTimeOut) {
			clearTimeout(this.cleanupTimeOut);
			this.cleanupTimeOut = null;
		}
	}

	sendToAllExcept(client, msg) {

		for (let id in this.clients) {

			if (id != client.inRoomID) {
				this.clients[id].client.socket.send(msg);
			}
		}
	}

	/**
	 * 
	 * @param {MessageEvent} message 
	 */
	handleMessage(client, message) {

		console.log("Room recieved message: " + message.data);
		const jsonMsg = JSON.parse(message.data);

		switch (jsonMsg.method) {
			case 'heartBeat':
				const clientObj = this.clients[jsonMsg.id];

				if (clientObj) {
					clientObj.lastHResponse = new Date().valueOf();
				}
				break;

			case 'getGameState':
				client.send(JSON.stringify({ error: false, method: 'stateRefresh', gameState: this.logic.getGameState() }));
				break;

			case 'piecePlaced':

				if (this.logic.piecePlaced(jsonMsg.id, jsonMsg.oX, jsonMsg.oY, jsonMsg.dX, jsonMsg.dY)) {

					const msg = JSON.stringify({ error: false, method: 'piecePlaced', id: jsonMsg.id, oX: jsonMsg.oX, oY: jsonMsg.oY, dX: jsonMsg.dX, dY: jsonMsg.dY });
					this.sendToAllExcept(client, msg);

				} else {
					client.socket.send(JSON.stringify({ error: true, method: 'invalidMove', id: jsonMsg.id, oX: jsonMsg.oX, oY: jsonMsg.oY, dX: jsonMsg.dX, dY: jsonMsg.dY }))
				}
				break;

			case 'pieceMoved':

				if (this.logic.pieceExists(jsonMsg.squareID)) {

					const msg = JSON.stringify({ error: false, method: 'pieceMoved', squareID: jsonMsg.squareID, x: jsonMsg.x, y: jsonMsg.y });
					this.sendToAllExcept(client, msg);

				} else {
					client.socket.send(JSON.stringify({ error: true, method: 'pieceDoesNotExist', squareID: jsonMsg.squareID }));
				}

				break;

			default:
				console.error('Unrecognized method "' + jsonMsg.method + '" recieved from client.');
		}
	}

	/**
	 * 
	 * @param {Client} client 
	 */
	handleClientClose(client) {

		console.log("Removing client from room.");


		if (client.inRoomID in this.clients) {
			delete this.clients[client.inRoomID];
			this.numClients--;
			console.log("Removed client from room " + this.roomID);
		} else {
			console.log("Failed to removed client from room " + this.roomID);
		}

		if (this.numClients === 0) {
			this.startCleanupTimer();
		}
	}


	closeClients() {

		for (let id in this.clients) {
			this.clients[id].client.close();
		}
	}


	close() {

		clearTimeout(this.cleanupTimeOut);
		clearTimeout(this.heartBeatTimeOut);

		this.closeClients();
		this.emit("close", this.roomID);
	}

}


module.exports = Room;