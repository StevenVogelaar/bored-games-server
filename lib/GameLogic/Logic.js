const events = require('events');

/**
 * events:
 * 		pieceRemoved(id <Number>, x <Number>, y <Number>)
 * 		changePieceType(id <Number>, x <Number>, y <Number>, type <String>)
 * 		won(player <Number>)
 */
class Logic extends events.EventEmitter {


	constructor() {
		super();
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
	 * @throws {Error} on invalid move.
	 * @returns {boolean} true if the turn is complete, false if the player is able to take more actions.
	 */
	piecePlaced(id, oX, oY, dX, dY) {
		throw new Error('Logic.piecePlaced(oX, oY, dX, dY) must be implemented.')
	}


	pieceExists(id) {
		throw new Error('Logic.pieceExists(id) must be implemented.');
	}

	/**
	 * @returns {Number} player
	 * 		-1 if no one has won.
	 */
	isWinConditionMet() {
		throw new Error('Logc.isWinConditionMet() must be implemented.');
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
	getGameState() {
		return this.gameState;
	}

	// ====================================

	setDefaultGameState() {
		throw new Error('Logic.setDefaultGameState must be implemented.')
	}

	getPlayingPlayer() {
		throw new Error('Logic.getPlayingPlayer must be implemented.');
	}
}

module.exports = Logic;