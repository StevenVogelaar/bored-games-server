
const MongoDB = require('mongodb');
const ConfigManager = require('./ConfigManager');


class DBService {

	constructor(){

	}

	/**
	 * @returns {MongoDB.MongoClient}
	 */
	static getDBClient() {

		return this.dbClient;
	}

	/**
	 * @returns {MongoDB.Db}
	 */
	static getDB(){
		return this.dbClient.db("boredDB");
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

		const config = ConfigManager.getConfig();


		// Check to see if this server is already registered.
		if (config.gserversID != null) {

			try {

				let result = await gservers.findOne({ _id: new MongoDB.ObjectID(config.gserversID) });

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
				host: config.address,
				port: config.port
			});

			console.log(result);

			// Save id so we dont keep making duplicates on restart.
			config.gserversID = result.insertedId;
			ConfigManager.writeConfig(config);

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