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
 * 		{error: false, method: 'heartBeat', id: <Number>}
 * 
 * expected response:
 * 		{error: <boolean>, method: 'heartBeat', id: <Number>}
 * 
 * 		Same id as the recieved heartbeat message.
 * 
 * - gameMove -
 * 		{error: false, pieceID: }
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
		this.cleanupTimeOut = setTimeout(this.cleanupRoom, ROOM_CLEANUP_TIMEOUT);
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
		this.numClients ++;
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

			default:
				console.error('Unrecognized method "' + jsonMsg.method + '" recived from client.');
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
			this.numClients --;
			console.log("Removed client from room " + this.roomID);
		} else {
			console.log("Failed to removed client from room " + this.roomID);
		}

		if (this.numClients === 0) {
			this.cleanupTimeOut = setTimeout(this.cleanupRoom, ROOM_CLEANUP_TIMEOUT);
		}
	}


	closeClients() {
	
		for (let id in this.clients){
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