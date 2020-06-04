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
	 * @returns {boolean} true if the turn is complete, false if the player is able to take more actions.
	 * 		
	 */
	piecePlaced(id, oX, oY, dX, dY, player) {

		// Update gamestate.
		const boardIndex = (oY * 8) + oX;
		const piece = this.gameState.board[oY][oX];

		console.log("Player: " + player);
		console.log('Owner: ' + piece.getOwner());

		if (player !== this.getPlayingPlayer()) throw new Error('It is not your turn');
		if (player !== piece.getOwner()) throw new Error('That is not your piece.');
		if (piece.getOwner() !== this.getPlayingPlayer()) throw new Error('It is not your turn.')
		if (dX > 8 || dX < 0 || dY > 8 || dY < 0) throw new Error('Move is outside of the board.'); // bounds check

		// If there are valid jumps, the player must take one of them.
		const validJumps = this.checkForJumps();

		let isJump = false;
		if (Object.keys(validJumps).length > 0) {
			// make sure the given move is one of the valid jumps.
			for (var index in validJumps) {
				if (validJumps[index].piece.getID() === id && validJumps[index].dX === dX && validJumps[index].dY === dY) {
					isJump = true;
					break;
				}
			}

			if (!isJump) throw new Error('You must take your opponents piece if you are able to.');
		}

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
							var jumpedPiece = this.checkJump(piece, -1, dY, dX, oX);
							if (!jumpedPiece) throw new Error('You cannot jump over that piece.');
						}

					} else {
						throw new Error('That piece can only be moved foward diagonaly.');
					}

				} else {

					if (
						(dY == oY - 1 && (dX == oX - 1 || dX == oX + 1)) ||
						(dY == oY - 2 && (dX == oX - 2 || dX == oX + 2))
					) {
						if (oY - dY == 2) { // jump
							var jumpedPiece = this.checkJump(piece, 1, dY, dX, oX);
							if (!jumpedPiece) throw new Error('You cannot jump over that piece.');
						}
					} else {
						throw new Error('That piece can only be moved foward diagonaly.');
					}
				}

			} else { // queen
				if (
					(dY == oY + 1 && (dX == oX - 1 || dX == oX + 1)) ||
					(dY == oY + 2 && (dX == oX - 2 || dX == oX + 2)) ||
					(dY == oY - 1 && (dX == oX - 1 || dX == oX + 1)) ||
					(dY == oY - 2 && (dX == oX - 2 || dX == oX + 2))
				) {

					if (Math.abs(dY - oY) == 2) { // jump
						var jumpedPiece = this.checkJump(piece, (dY > oY) ? -1 : 1, dY, dX, oX);
						if (!jumpedPiece) throw new Error('You cannot jump over that piece.');
					}

				} else {
					throw new Error('That piece can only be moved diagonaly.');
				}
			}


			this.gameState.board[oY][oX] = null;
			this.gameState.board[dY][dX] = piece;


		} else {
			throw new Error("An error has occured, please refresh the page.");
		}


		if (isJump) { // Remove piece if the move was a valid jump
		
			this.emit('pieceRemoved', jumpedPiece.id, jumpedPiece.x, jumpedPiece.y);
			this.gameState.board[jumpedPiece.y][jumpedPiece.x] = null;

			// Check for win condition
			const win = this.isWinConditionMet();
			if (win > 0){
				this.emit('won', win);
			}
		}

		const newJumps = this.checkForJumps();

		// Upgrade to queen if reached the last row (Important to do this after checking for new jumps)
		if ((player === 1 && dY === 7) || (player === 2 && dY === 0)) {
			this.gameState.board[dY][dX].setPieceType('queen');
			this.emit('changePieceType', piece.getID(), dX, dY, 'queen');
		}

		if (Object.keys(newJumps).length > 0 && isJump) {
			return false;
		} else {
			this.gameState.player = this.gameState.player === 1 ? 2 : 1;
			return true;
		}
	}

	/**
	 * @returns {Number} player
	 * 		-1 if no one has won.
	 */
	isWinConditionMet() {
		
		var p1Count = 0;
		var p2Count = 0;

		for (var y = 0; y < 8; y ++){
			for (var x = 0; x < 8; x++){
				const piece = this.gameState.board[y][x];

				if (piece){
					if (piece.getOwner() === 1){
						p1Count ++;
					} else {
						p2Count ++;
					}
				}
			}
		}

		if (p1Count === 0) return 2;
		if (p2Count === 0) return 1;

		return -1;
	}

	/**
	 * Checks if there are possible jumps available for the current player.
	 * @returns {boolean}
	 */
	checkForJumps() {

		const validJumps = {}
		var n = 0;

		for (var y = 0; y < 8; y++) {
			for (var x = 0; x < 8; x++) {
				const piece = this.gameState.board[y][x];
				if (piece) {
					if ((piece.getPieceType() === 'queen' && (this.getPlayingPlayer() === piece.getOwner())) || (this.getPlayingPlayer() === 1 && piece.getOwner() === 1)) {
						if (this.checkJump(piece, -1, y + 2, x - 2, x)) { validJumps[n] = { piece: piece, dX: x - 2, dY: y + 2 }; n++ }
						if (this.checkJump(piece, -1, y + 2, x + 2, x)) { validJumps[n] = { piece: piece, dX: x + 2, dY: y + 2 }; n++ }
					}
					if ((piece.getPieceType() === 'queen' && (this.getPlayingPlayer() === piece.getOwner())) || (this.getPlayingPlayer() === 2 && piece.getOwner() === 2)) {
						if (this.checkJump(piece, 1, y - 2, x - 2, x)) { validJumps[n] = { piece: piece, dX: x - 2, dY: y - 2 }; n++ }
						if (this.checkJump(piece, 1, y - 2, x + 2, x)) { validJumps[n] = { piece: piece, dX: x + 2, dY: y - 2 }; n++ }
					}
				}
			}
		}

		console.log('VALID JUMPS: ' + JSON.stringify(validJumps));
		return validJumps;
	}

	checkJump(piece, yOffset, dY, dX, oX) {


		if (dY < 0 || dY > 7 || dX < 0 || dX > 7) return null;

		let jumpedPiece = null;

		if (this.gameState.board[dY][dX]) return null;

		var x;
		var y;

		if (dX > oX) { // right jump
			x = dX - 1;
			y = dY + yOffset;
			jumpedPiece = this.gameState.board[y][x];

		} else { // left jump
			x = dX + 1;
			y = dY + yOffset;
			jumpedPiece = this.gameState.board[y][x];
		}

		if (!jumpedPiece || jumpedPiece.getOwner() === piece.getOwner()) {
			return null;
		}

		console.log('JUMPED PIECE: ' + JSON.stringify({ id: jumpedPiece.getID(), x: x, y: y }));
		return { id: jumpedPiece.getID(), x: x, y: y };
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
			player: 1
		};
	}

	getPlayingPlayer() {
		return this.gameState.player;
	}

}

module.exports = CheckersLogic;