const autoBind = require('auto-bind');

class GamePiece{

	/**
	 * 
	 * @param {String} pieceType 
	 * 		Custom piece info for each game. (Checkers has pawn, and queen for example.)
	 * @param {String} owner 
	 * 		One of: p1, p2, ... pn.
	 * @param {Object} stateInfo 
	 * 		Custom meta info to be defined per-game.
	 */
	constructor(pieceType, owner, stateInfo){

		autoBind(this);

		this.pieceType = pieceType;
		this.owner = owner;
		this.stateInfo = stateInfo;
	}

	// =========== Public interface methods ===========


	toJSONObject(){

		return {
			pieceType: this.pieceType,
			owner: this.owner,
			stateInfo: this.stateInfo
		}
	}

	/**
	 * @returns {String}
	 */
	getPieceType(){

		return this.pieceType;
	}

	/**
	 * @returns {String}
	 */
	getOwner(){
		return this.owner;
	}

	/**
	 * @returns {Object}
	 */
	getStateInfo(){
		return this.stateInfo;
	}

	// ================================================

}

module.exports = GamePiece;