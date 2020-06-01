const Logic = require('./Logic');
const GamePiece = require('../GameObjects/GamePiece');

class CheckersLogic extends Logic {

	constructor(props){

		super(props);

	}

	// ===== Public interface methods =====

	/**
	 * @param {Number} id
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

		// Update gamestate.
		const boardIndex = (oY * 8) + oX;
		console.log("board index: " + boardIndex);
		const piece = this.gameState.board[oY][oX];

		if (piece && piece.id == id){

			// TODO: Check game rules

			this.gameState.board[oY][oX] = null;
			this.gameState.board[dY][dX] = piece;

			//this.emit('gameStateUpdated', this.gameState, oX, oY, dX, dY);

		} else {
			return false;
		}

		return true;
	}

	pieceExists(squareID){

		const y = Math.trunc(squareID / 8);
		const x = squareID % 8;

		if (this.gameState.board[y][x]){
			return true;
		}

		console.log(JSON.stringify(this.gameState.board));
		return false;
	}


	// ====================================

	/**
	 * All the properties in gameState are set here, no need to look elsewhere.
	 */
	setDefaultGameState(){

		const board = [8];
		const pieceIDs = {}; // Storing all the piece ids in an object for faster lookup for the purpose of move validation.
		var id = 0;

		for (var y = 0; y < 8; y++){

			board[y] = new Array(8);

			for (var x = 0; x < 8; x++){

				if (y < 3){
					if ((x + (y % 2)) % 2 === 1){
						pieceIDs[id] = true;
						board[y][x] = new GamePiece(id++, 'pawn', 'p1', {});
					}
				} else if (y > 4){

					if ((x + (y % 2)) % 2 === 1){
						pieceIDs[id] = true;
						board[y][x] = new GamePiece(id++,'pawn', 'p2', {});
					}
				}
				
			}
		}

		this.gameState = {
			board: board,
			pieceIDs: pieceIDs
		};
	}

	
}

module.exports = CheckersLogic;