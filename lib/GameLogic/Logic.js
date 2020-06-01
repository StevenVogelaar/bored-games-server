const events = require('events');

/**
 */
class Logic{


	constructor(){
		this.gameState = null;
		this.setDefaultGameState();
	}

	// ===== Public interface methods =====

	/**
	 * @param {number} id
	 * Origin:
	 * @param {Number} oX 
	 * @param {Number} oY 
	 * Destination:
	 * @param {Number} dX 
	 * @param {Number} dY 
	 * 
	 * @returns {boolean}
	 * 		True is move was successfull (valid), false otherwise.
	 */
	piecePlaced(id, oX, oY, dX, dY){
		throw new Error('Logic.piecePlaced(oX, oY, dX, dY) must be implemented.')
	}


	pieceExists(id){
		throw new Error('Logic.pieceExists(id) must be implemented.');
	}

	/**
	 * 
	 * Example:
	 * 
	 * 	{
	 * 		board: 
	 * 		[
	 * 			[<GamePiece | null>, ... <GamePiece> | null],
	 * 				...
	 * 			[<GamePiece | null>, ... <GamePiece> | null]
	 * 		],
	 * 		
	 * 	}
	 */
	getGameState(){
		return this.gameState;
	}

	// ====================================

	setDefaultGameState(){
		throw new Error('Logic.setDefaultGameState must be implemented.')
	}
}

module.exports = Logic;