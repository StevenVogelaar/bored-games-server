const fs = require('fs');


const configPath = './config.json'

class ConfigManager{
	


	

	/**
	 * Get the config instance. No other methods are required before calling this one.
	 * 
	 * @param {boolean} refresh 
	 */
	static getConfig(refresh=false){


		if (!this.config || refresh){
			this.config = this.readConfig();
		}

		return this.config;
	}


	static openConfig(){

		if (this.opened) return;

		try {
	
			fs.openSync(configPath, fs.constants.O_CREAT, fs.constants.S_IWUSR);
			this.opened = true;
			
		} catch (err){
		
			console.log(err);
			process.kill(process.pid, 'SIGTERM');
		}
	}
	
	/**
	 * See writeDefaultConfig for all valid config contents.
	 */
	static readConfig(){

		if (!this.opened){
			this.openConfig();
		}
	
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
			this.writeDefaultConfig();
			return this.readConfig();
		}
	
		return config;
	}

	/**
	 * 
	 * @param {Object} config 
	 * 		See writeDefaultConfig() for valid Object properties.
	 */
	static writeConfig(config){
		if (!this.opened) throw Error("Call openConfig() before writeConfig(config)");

		fs.writeFile(configPath, JSON.stringify(config), () => {console.log("Config updated.")});
		this.config = config;
	}
	
	static writeDefaultConfig(){

		if (!this.opened) throw Error("Call openConfig() before writeDefaultConfig()");

		const config = {
			version: 1.0,
			dbConnectString: 'mongodb://localhost:27017',
			port: 3820,
			address: 'ws://127.0.0.1',
			gserversID: null
		};
	
		fs.writeFileSync(configPath, JSON.stringify(config));
	}
	

}

module.exports = ConfigManager;