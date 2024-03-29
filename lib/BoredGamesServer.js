const Client = require("./Client");
const ConfigManager = require("./ConfigManager");
const autoBind = require('auto-bind');
const WebSocket = require('ws');
const DBService = require('./DBService');
const RoomManager = require('./RoomManager');

const os = require('os');

class BoredGamesServer {

	/**
	 * 
	 */
	constructor() {

		autoBind(this);

		this.port = ConfigManager.getConfig().port;
		this.connections = Array();
	}


	run() {

		console.log("Starting listening server on port: %d", this.port);
		this.server = new WebSocket.Server({ port: this.port });
		this.server.on('connection', this.handleConnection);
	}

	async stop() {

		this.server.close();
		for (const connection of this.connections) {
			connection.close();
		}

		await RoomManager.stop();
		await DBService.unregisterWithDB();
		await DBService.getDBClient().close();
	}


	handleClose() {

		console.log("Server Closed");
	}


	/**
	 * 
	 * @param {WebSocket} socket 
	 */
	handleConnection(socket) {

		console.log("New connection.");
		const connection = new Client(socket, this.handleSocketClosed);
		connection.once('closed', this.handleSocketClosed); // No need to remove
		this.connections.push(connection);
	}

	handleError(error) {

		console.log(error);
		process.kill(process.pid, 'SIGTERM');
	}

	handleListening() {

		console.log("Listening for connections.");
	}


	/**
	 * Should be called whenever a socket is closed so it can be removed from
	 * this.connections.
	 * 
	 * @param {Connection} connection
	 */
	handleSocketClosed(connection) {

		const index = this.connections.indexOf(connection);

		if (index != -1) {
			this.connections.splice(index, 1);
			console.log("Removed socket from connections.");
		} else {
			console.log("Failed to removed socket from connections.");
		}
	}


}

module.exports = BoredGamesServer;