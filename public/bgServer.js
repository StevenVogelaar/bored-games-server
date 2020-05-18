const BoredGamesServer = require("../lib/BoredGamesServer");
const ConfigManager = require("../lib/ConfigManager");
const DBService = require("../lib/DBService");


server = new BoredGamesServer();

process.on('SIGTERM', () => {
	console.log("Process terminating ...");
	server.stop();
})

process.on('SIGINT', () => {
	console.log("Process terminating ...");

	server.stop();
})


startServer();


async function startServer() {

	await DBService.connectToDB();

	
	server.run();
}



