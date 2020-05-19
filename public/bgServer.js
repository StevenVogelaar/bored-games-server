const BoredGamesServer = require("../lib/BoredGamesServer");
const ConfigManager = require("../lib/ConfigManager");
const DBService = require("../lib/DBService");
const RoomManager = require('../lib/RoomManager');


server = new BoredGamesServer();

process.on('SIGTERM', () => {
	console.log("Process terminating ...");
	server.stop();
})

process.on('SIGINT', () => {
	console.log("Process terminating ...");

	server.stop();
})


RoomManager.init();
startServer();


async function startServer() {

	await DBService.connectToDB();

	
	server.run();
}



