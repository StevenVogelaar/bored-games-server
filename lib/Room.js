const Client = require('./Client');
const events = require('events');


/**
 * Events: close <String>  --- Called with roomID
 */
class Room extends events.EventEmitter{

	/**
	 * 
	 * @param {String} roomID 
	 */
	constructor(roomID) {

		super();

		console.log("Creating room with id: " + roomID);

		this.roomID = roomID;
		this.clients = [];

		this.timeOut = setTimeout(this.cleanupRoom, 300000); 
	}


	/**
	 * 
	 * @param {Client} client
	 */
	addClient(client) {

		client.addListener('closed', this.handleClientClose);
		client.unregisterDefaultSocketListeners();

		client.socket.addEventListener('message', this.handleMessage);
		this.clients.push(client);
	}


	cleanupRoom(){

		if (this.clients.length === 0){

			this.close();
			return;
		}

		setTimeout(this.cleanupRoom, 300000); 
	}

	/**
	 * 
	 * @param {MessageEvent} message 
	 */
	handleMessage(message){

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
	close(){

		this.timeOut.clearTimeout();
		this.emit("close", this.roomID);
	}

}


module.exports = Room;