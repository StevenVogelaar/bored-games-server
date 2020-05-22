const Client = require('../Client');
const events = require('events');
const autoBind = require('auto-bind');
const RoomFullError = require('../Errors/RoomFullError');


/**
 * Events: close <String>  --- Called with roomID
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

		this.roomID = roomID;
		this.clients = [];
		this.maxClients = 2;

		this.cleanupTimeOut = setTimeout(this.cleanupRoom, 300000);
		this.heartBeatTimeOut = setTimeout(this.heartBeat, 5000);
	}


	/**
	 * 
	 * @param {Client} client
	 */
	addClient(client) {

		if (this.clients.length > this.maxClients) {
			throw new RoomFullError("Room is full.");
		}

		client.addListener('closed', this.handleClientClose);
		client.unregisterDefaultSocketListeners();

		client.socket.addEventListener('message', this.handleMessage);
		this.clients.push(client);
	}


	cleanupRoom() {

		if (this.clients.length === 0) {

			this.close();
			return;
		}

		this.cleanupTimeOut = setTimeout(this.cleanupRoom, 300000);
	}

	heartBeat() {

		for (let client of this.clients) {
			client.socket.send(JSON.stringify({ error: false, msgType: "heartBeat" }));
		}

		this.heartBeatTimeOut = setTimeout(this.heartBeat, 5000);
	}


	/**
	 * 
	 * @param {MessageEvent} message 
	 */
	handleMessage(message) {

		console.log("Room recieved message: " + message.data);
	}

	/**
	 * 
	 * @param {Client} client 
	 */
	handleClientClose(client) {

		const index = this.clients.indexOf(client);

		if (index != -1) {
			this.clients.splice(index, 1);
			console.log("Removed client from room " + this.roomID);
		} else {
			console.log("Failed to removed client from room " + this.roomID);
		}
	}


	/**
	 * RoomManager handles the actual closing operations.
	 */
	close() {

		clearTimeout(this.cleanupTimeOut);
		this.emit("close", this.roomID);
	}

}


module.exports = Room;