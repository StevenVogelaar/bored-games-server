const DBService = require('./DBService');
const crypto = require('crypto');
const RoomManager = require('./RoomManager');
const sanitize = require('mongo-sanitize')
const RoomFullError = require('./Errors/RoomFullError');


/**
 * All remote input gets sanitized.
 */
class GameService{


	static createGameRoom(type, password){

		if (this.getValidGameTypes().includes(type) === false) throw new Error("Invalid game type: " + type);

		return RoomManager.createRoom(type, sanitize(password));
	}


	static joinGameRoom(roomID, client){


		try {
			RoomManager.joinGameRoom(sanitize(roomID), client);
		} catch (err){
			if (err instanceof RoomFullError){
				throw err;
			} else {
				console.log(err);
				throw new Error("Internal Error.");
			}
		}
	}

	static getValidGameTypes(){
		return [
			"checkers"
		]
	}


}

module.exports = GameService;