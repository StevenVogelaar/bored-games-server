const BoredGamesServer = require("../lib/BoredGamesServer.js");
const fs = require('fs');

const configPath = './config.json'

process.on('SIGTERM', () => {
	console.log("Process terminating ...");
	server.stop();
})

process.on('SIGINT', () => {
	console.log("Process terminating ...");
	server.stop();
})


openConfig();
const config = readConfig();





const server = new BoredGamesServer(config);
server.run();


function openConfig(){

	try {

		fs.openSync(configPath, fs.constants.O_CREAT, fs.constants.S_IWUSR);
		
	} catch (err){
	
		console.log(err);
		process.kill(process.pid, 'SIGTERM');
	}
}

/**
 * See writeDefaultConfig for all valid config contents.
 */
function readConfig(){

	let config;

	try {
		config = JSON.parse(fs.readFileSync(configPath));
	} catch (err){
		if (err instanceof SyntaxError){
			config = {};
		} else {
			throw err;
		}
	}
	
	if (config.version === undefined){
		writeDefaultConfig();
		return readConfig();
	}

	return config;
}

function writeDefaultConfig(){
	const config = {
		version: 1.0,
		dbConnectString: 'mongodb://localhost:27017',
		port: 3820,
		address: '127.0.0.1'
	};

	fs.writeFileSync(configPath, JSON.stringify(config));
}

