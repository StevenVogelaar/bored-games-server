const DBService = require('./DBService');
const crypto = require('crypto');
const RoomManager = require('./RoomManager');


class GameService{


	static createGameRoom(){

		return RoomManager.createRoom();
	}


	static joinGameRoom(roomID, client){

		RoomManager.joinGameRoom(roomID, client);
	}


}

module.exports = GameService;