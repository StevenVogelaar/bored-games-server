const autoBind = require('auto-bind');

class GamePiece{

	/**
	 * 
	 * 
	 * @param {Number} id
	 * 		Unique id for the piece.
	 * @param {String} pieceType 
	 * 		Custom piece info for each game. (Checkers has pawn, and queen for example.)
	 * @param {String} owner 
	 * 		One of: p1, p2, ... pn.
	 * @param {Object} stateInfo 
	 * 		Custom meta info to be defined per-game.
	 */
	constructor(id, pieceType, owner, stateInfo){

		autoBind(this);

		this.id = id;
		this.pieceType = pieceType;
		this.owner = owner;
		this.stateInfo = stateInfo;
	}

	// =========== Public interface methods ===========

	getID(){
		return this.id;
	}

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