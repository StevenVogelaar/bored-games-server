const Room = require('./Room');
const DBService = require('./DBService');
const ConfigManager = require('./ConfigManager');
const crypto = require('crypto');

class RoomManager{

	static init(){

		/**
		 * Example:
		 * {
		 * <String>: <Room>,
		 * <String>: <Room>
		 * 
		 * }
		 * 
		 * Where each <String> is the room ID.
		 */
		this.rooms = [];

	}


	static async createRoom(){
		
		const roomCollection = DBService.getDB().collection("rooms");

		while (true){

			var roomID = crypto.randomBytes(4).toString("hex");

			const queryRes = await roomCollection.findOne({roomID: roomID});
			if (queryRes == null) break;
		}
		
		const config = ConfigManager.getConfig();

		this.rooms[roomID] = new Room(roomID);
		this.rooms[roomID].addListener("close", this.roomClosed);

		const res = await roomCollection.insertOne({'roomID': roomID, host: config.host, port: config.port});

		if (res.result.ok !== 1) throw Error("Could not create the game room.");

		return roomID;
	}

	static joinGameRoom(roomID, client){

		if (roomID in this.rooms === false) throw Error("Requested room does not exist on this server.");

		this.rooms[roomID].addClient(client);
	}


	static async roomClosed(roomID){

		if (roomID in this.rooms){

			for (var client in this.rooms[roomID].clients){
				client.close();
			}
		}

		const roomCollection = DBService.getDB().collection("rooms");
		await roomCollection.deleteOne({'roomID': roomID}); //TODO maybe change this to deleteMany in the case that the server is stopping.

		console.log("Room " + roomID + " has been closed.");
	}

	static async stop(){

		console.log("Closing all rooms");

		for (var roomID in this.rooms){
			await this.roomClosed(roomID);
		}
	}

}

module.exports = RoomManager;
