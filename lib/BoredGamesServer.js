const Connection = require("./Connection");
const autoBind = require('auto-bind');
const WebSocket = require('ws');
const MongoDB = require('mongodb');
const os = require('os');

class BoredGamesServer {

	/**
	 * 
	 * @typedef {object} Config
	 * @property {number} version
	 * @property {string} dbConnectString
	 * @property {number} port
	 * 
	 * @param {Config} config 
	 * 		See readConfig() in bgServer.js for valid config properties.
	 */
	constructor(config) {


		autoBind(this);

		console.log(config);

		this.port = config.port;
		this.config = config; // Little gross but ok for now ...


		this.connections = Array();

		MongoDB.connect(this.config.dbConnectString, { useUnifiedTopology: true }).then(this.registerWithDB).catch(
			(err) => { console.log(err); process.kill(process.pid, 'SIGTERM'); }
		)
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

		// Unregister from db
		if (this.gserversID) {

			try {

				await this.gservers.deleteOne({
					_id: this.gserversID
				});

			} catch (err) {
				console.log(err);
			}
		}

		await this.dbClient.close();
	}

	async registerWithDB(dbClient) {

		this.dbClient = dbClient;

		if (!this.dbClient.isConnected()) await this.dbClient.connect();


		const db = this.dbClient.db('boredDB');
		this.gservers = db.collection('gservers');


		try {

			const result = await this.gservers.insertOne({
				host: this.config.address,
				port: this.port
			});

			console.log(result);

			this.gserversID = result.insertedId;

		} catch (err) {

			console.log(err);
			process.kill(process.pid, 'SIGTERM');
		}

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
		const connection = new Connection(socket, this.handleSocketClosed);
		connection.addListener('closed', this.handleSocketClosed);
		this.connections.push(connection);
	}

	handleError(error) {

		console.log(error);
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