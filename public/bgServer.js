const BoredGamesServer = require("../lib/BoredGamesServer.js");
const ConfigManager = require("../lib/ConfigManager");

process.on('SIGTERM', () => {
	console.log("Process terminating ...");
	server.stop();
})

process.on('SIGINT', () => {
	console.log("Process terminating ...");
	server.stop();
})


ConfigManager.openConfig();
const config = ConfigManager.readConfig();





const server = new BoredGamesServer(config);
server.run();



