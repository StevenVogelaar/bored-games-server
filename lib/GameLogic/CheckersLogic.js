const Logic = require('./Logic');
const GamePiece = require('../GameObjects/GamePiece');

class CheckersLogic extends Logic {

	constructor(props){

		super(props);

	}

	// ===== Public interface methods =====

	/**
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
	pieceMoved(oX, oY, dX, dY){


	}


	// ====================================

	setDefaultGameState(){

		const board = [8];

		for (var y = 0; y < 8; y++){

			board[y] = new Array(8);

			for (var x = 0; x < 8; x++){

				if (y < 3){

					if ((x + (y % 2)) % 2 === 1){
						board[y][x] = new GamePiece('pawn', 'p1', {});
					}
				} else if (y > 4){

					if ((x + (y % 2)) % 2 === 1){
						board[y][x] = new GamePiece('pawn', 'p2', {});
					}
				}
				
			}
		}

		this.gameState = {
			board: board
		};
	}

	
}

module.exports = CheckersLogic;