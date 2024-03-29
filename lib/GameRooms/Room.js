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
 * - playerAssignment -
 * 		(server) request: {error: false, method: 'playerAssignment', player: <Number>}
 * 					// No response expected.
 * 					// player will be either 1 or 2.
 * 
 * - invalidMove -
 * 		(server) request: {error: true, method: 'invalidMove', id: <Number>, oX: <Number>, oY: <Number>, dX: <Number>, dY: <Number>}
 * 
 * - resetPosition -
 * 		(server) request: {error: false, method: 'resetPosition', id: <Number>, x, y}
 * 
 * - playerTurn -
 * 		(server) request: {error: false, method: 'playerturn', player: <Number>}
 * 
 * - removePiece -
 * 		(server) request: {error: false, method: 'removePiece', id <Number>, x: <Number>, y: <Number>}
 * 
 * - changePieceType -
 * 		(server) request: {error: false, method: 'changePeiceType', id: <Number>, x: <Number>, y: <Number>, type: <String>}
 * 
 * - won -
 * 		(server) request: {error: false, method: 'won', player: <Number>}
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
		this.logic.addListener('pieceRemoved', this.pieceRemovedHandler);
		this.logic.addListener('changePieceType', this.changePieceTypeHandler);
		this.logic.addListener('won', this.wonHandler);

		this.roomID = roomID;

		/**
		 * Object of objects in the form:
		 * {
		 * 		id: {id:<Number>, lastHResponse: <Number>, client: <Client>, player: <Number>},
		 * 			.
		 * 			.
		 * 			.
		 * 		id: {id:<Number>, lastHResponse: <Number>, client: <Client>, player: <Number>}
		 * }
		 * 
		 *  player starts at 1.
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
		const player = this.findLowestFreePlayer();
		client.inRoomID = id;
		this.clients[id] = { id: id, lastHResponse: new Date().valueOf(), client: client, player: player };
		this.numClients++;


		client.socket.send(JSON.stringify({ error: false, method: 'playerAssignment', player: player }));
		// Go ahead and send them the current gamestate.
		client.socket.send(JSON.stringify({ error: false, method: 'stateRefresh', gameState: this.logic.getGameState() }));
		this.stopCleanupTimer();
	}

	findLowestFreePlayer() {

		if (this.numClients === 0) {
			return 1;
		}

		const playerNums = {};

		for (let id in this.clients) {
			playerNums[this.clients[id].player] = true;
		}

		for (var i = 1; i <= this.numClients + 1; i++) {
			if (i in playerNums === false) {
				return i;
			}
		}

		throw Error("Could not find available player assignment."); // This shouldn't happen.
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

			if (client === null || id != client.inRoomID) {
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
				client.socket.send(JSON.stringify({ error: false, method: 'stateRefresh', gameState: this.logic.getGameState() }));
				break;

			case 'piecePlaced':

				if (this.logic.isWinConditionMet() > 0) {
					client.socket.send(JSON.stringify({
						error: true, method: 'invalidMove', id: jsonMsg.id, oX: jsonMsg.oX, oY: jsonMsg.oY, dX: jsonMsg.dX, dY: jsonMsg.dY, message:
							'The game has finished.'
					}));
					return;
				}

				try {

					if (jsonMsg.oX == jsonMsg.dX && jsonMsg.oY == jsonMsg.dY) {
						const msg = (JSON.stringify({ error: false, method: 'resetPosition', id: jsonMsg.id, x: jsonMsg.oX, y: jsonMsg.oY }))
						this.sendToAllExcept(null, msg);
					} else {

						const turnDone = this.logic.piecePlaced(jsonMsg.id, jsonMsg.oX, jsonMsg.oY, jsonMsg.dX, jsonMsg.dY, this.clients[client.inRoomID].player);

						const msg = JSON.stringify({ error: false, method: 'piecePlaced', id: jsonMsg.id, oX: jsonMsg.oX, oY: jsonMsg.oY, dX: jsonMsg.dX, dY: jsonMsg.dY });
						this.sendToAllExcept(client, msg);

						if (turnDone) { // Not really needed I suppose....
							const pmsg = JSON.stringify({ error: false, method: 'playerTurn', player: this.logic.getPlayingPlayer() });
							this.sendToAllExcept(null, pmsg);
						}
					}

				} catch (err) {
					client.socket.send(JSON.stringify({ error: true, method: 'invalidMove', id: jsonMsg.id, oX: jsonMsg.oX, oY: jsonMsg.oY, dX: jsonMsg.dX, dY: jsonMsg.dY, message: err.message }));

					const msg = (JSON.stringify({ error: false, method: 'resetPosition', id: jsonMsg.id, x: jsonMsg.oX, y: jsonMsg.oY }))
					this.sendToAllExcept(client, msg);
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

	pieceRemovedHandler(id, x, y) {
		const msg = JSON.stringify({ error: false, method: 'removePiece', id: id, x: x, y: y });
		this.sendToAllExcept(null, msg);
	}

	changePieceTypeHandler(id, x, y, type) {
		const msg = JSON.stringify({ error: false, method: 'changePieceType', id: id, x: x, y: y, type: type });
		this.sendToAllExcept(null, msg);
	}

	wonHandler(player) {
		const msg = JSON.stringify({ error: false, method: 'won', player: player });
		this.sendToAllExcept(null, msg);
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