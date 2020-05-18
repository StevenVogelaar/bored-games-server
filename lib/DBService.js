
const MongoDB = require('mongodb');
const ConfigManager = require('./ConfigManager');


class DBService {

	constructor(){

	}

	static getDBClient() {

		return this.dbClient;
	}


	static async connectToDB() {

		try {

			const dbClient = await MongoDB.connect(ConfigManager.getConfig().dbConnectString, { useUnifiedTopology: true });
			await this.registerWithDB(dbClient);

		} catch (err) {
			console.error(err);
			process.kill(process.pid, 'SIGTERM');
		}

	}


	static async registerWithDB(dbClient) {

		this.dbClient = dbClient;

		if (!this.dbClient.isConnected()) await this.dbClient.connect();

		const db = this.dbClient.db('boredDB');
		const gservers = db.collection('gservers');


		// Check to see if this server is already registered.
		if (ConfigManager.getConfig().gserversID != null) {

			try {

				let result = await gservers.findOne({ _id: new MongoDB.ObjectID(ConfigManager.getConfig().gserversID) });

				if (result != null) {
					console.log("Server already registered with db.")
					return; // No need to re-register.
				}

			} catch (err) {
				console.error(err);
				process.kill(process.pid, 'SIGTERM');
			}
		}

		// Register with db.
		try {

			const result = await gservers.insertOne({
				host: ConfigManager.getConfig().address,
				port: this.port
			});

			console.log(result);

			// Save id so we dont keep making duplicates on restart.
			ConfigManager.getConfig().gserversID = result.insertedId;
			ConfigManager.writeConfig(ConfigManager.getConfig());

		} catch (err) {

			console.error(err);
			process.kill(process.pid, 'SIGTERM');
		}

	}

	static async unregisterWithDB() {

		// Unregister from db
		if (ConfigManager.getConfig().gserversID) {

			try {

				const db = this.dbClient.db('boredDB');
				const gservers = db.collection('gservers');

				console.log("Unregistering from db ... ");
				const result = await gservers.deleteOne({
					_id: new MongoDB.ObjectID(ConfigManager.getConfig().gserversID)
				});

				ConfigManager.getConfig().gserversID = null;
				ConfigManager.writeConfig(ConfigManager.getConfig());

			} catch (err) {
				console.log(err);
			}
		}
	}

}

module.exports = DBService;