const Logic = require('./Logic');
const GamePiece = require('../GameObjects/GamePiece');

class CheckersLogic extends Logic {

	constructor(props) {

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
	 * @param {Nunmber} player
	 * 
	 * @throws {Error} on invalid move.
	 * 		
	 */
	piecePlaced(id, oX, oY, dX, dY, player) {

		// Update gamestate.
		const boardIndex = (oY * 8) + oX;
		const piece = this.gameState.board[oY][oX];

		console.log("Player: " + player);
		console.log('Owner: ' + piece.getOwner());

		if (player !== piece.getOwner()) throw new Error('That is not your piece.');
		if (piece.getOwner() !== this.getPlayingPlayer()) throw new Error('It is not your turn.')
		if (dX > 8 || dX < 0 || dY > 8 || dY < 0) throw new Error('Move is outside of the board.'); // bounds check

		// TODO: Check for possible opponent captures (must take caputures if they are available)

		if (piece && piece.id == id) {

			if (this.gameState.board[dY][dX]) throw new Error('There is already a game piece there.');

			// TODO: Check game rules
			if (piece.getPieceType() == 'pawn') {
				// can only move diagonaly forward.
				// 4 cases, left, right, left jump, right jump
				if (piece.getOwner() == 1) {

					if (
						(dY == oY + 1 && (dX == oX - 1 || dX == oX + 1)) ||
						(dY == oY + 2 && (dX == oX - 2 || dX == oX + 2))
					) {

						if (dY - oY == 2) { // jump
							this.checkJump(piece, -1, dY, dX, oX);
						}

					} else {
						throw new Error('That piece can only be moved foward diagonaly.');
					}

				} else {

					if (
						(dY == oY - 1 && (dX == oX - 1 || dX == oX + 1)) ||
						(dY == oY - 2 && (dX == oX - 2 || dX == oX + 2))
					) {
						if (dY - oY == 2) { // jump
							this.checkJump(piece, 1, dY, dX, oX);
						}
					} else {
						throw new Error('That piece can only be moved foward diagonaly.');
					}
				}

			} else { // queen

			}


			this.gameState.board[oY][oX] = null;
			this.gameState.board[dY][dX] = piece;


		} else {
			return false;
		}

		this.gameState.player = this.gameState.player === 1 ? 2 : 1;
		return true;
	}

	checkJump(piece, yOffset, dY, dX, oX) {

		let jumpedPiece = null;

		if (dX > oX) { // right jump
			console.log("test1");
			jumpedPiece = this.gameState.board[dY + yOffset][dX - 1];

		} else { // left jump
			console.log("test2");
			jumpedPiece = this.gameState.board[dY + yOffset][dX + 1];
		}

		if (!jumpedPiece || jumpedPiece.getOwner() === piece.getOwner()) {
			throw new Error('You cannot jump over that piece.');
		}
	}

	pieceExists(squareID) {

		const y = Math.trunc(squareID / 8);
		const x = squareID % 8;

		if (this.gameState.board[y][x]) {
			return true;
		}

		console.log(JSON.stringify(this.gameState.board));
		return false;
	}


	// ====================================

	/**
	 * All the properties in gameState are set here, no need to look elsewhere.
	 */
	setDefaultGameState() {

		const board = [8];
		//const pieceIDs = {}; // Storing all the piece ids in an object for faster lookup for the purpose of move validation.
		var id = 0;

		for (var y = 0; y < 8; y++) {

			board[y] = new Array(8);

			for (var x = 0; x < 8; x++) {

				if (y < 3) {
					if ((x + (y % 2)) % 2 === 1) {
						//pieceIDs[id] = true;
						board[y][x] = new GamePiece(id++, 'pawn', 1, {});
					}
				} else if (y > 4) {

					if ((x + (y % 2)) % 2 === 1) {
						//	pieceIDs[id] = true;
						board[y][x] = new GamePiece(id++, 'pawn', 2, {});
					}
				}

			}
		}

		this.gameState = {
			board: board,
			//pieceIDs: pieceIDs,
			player: 1
		};
	}

	getPlayingPlayer() {
		return this.gameState.player;
	}

}

module.exports = CheckersLogic;