const DBService = require('./DBService');
const crypto = require('crypto');


class GameService{


	static createGameRoom(){

		const roomID = crypto.randomBytes(4).toString("hex");

		return roomID;
	}


	static joinGameRoom(roomID){

	}


}

module.exports = GameService;