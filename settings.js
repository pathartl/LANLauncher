const fs = require('fs');

class Settings {
    constructor() {
        this.config = {};
        this.configPath = __dirname + '/config.json';
        this.loadConfig();
    }

    loadConfig() {
    	var configPath = this.configPath;
        var defaults = this.getDefaultConfig();

        try {
            // Try to load config from file
            fs.openSync(configPath, 'r+');

            var data = fs.readFileSync(configPath);

            this.config = JSON.parse(data);
        } catch (err) {
            // If errored, try making config and write the defaults
            try {
                console.log('No config file found, creating from defaults');

                this.config = defaults;

                this.writeConfig();
            } catch (err) {
                console.log('Error: Could not open config.json for write')
            }
        }
    }

    writeConfig() {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 4));

            console.log('Wrote new config file');
        } catch (err) {
            console.log('Error: Could not write defaults to config.json')
        }
    }

    getDefaultConfig() {
        return {
            'gameConfigName': 'game.json',
            'gamesDir': './games',
        }
    }

    getGamesDirectory() {
        var directory = this.config.gamesDir;

        if (directory.indexOf('./') === 0) {
            directory = __dirname + directory.substr(1);
        }

        return directory;
    }

    setGamesDirectory(directory) {
        if (directory.indexOf('./') === 0) {
            directory = __dirname + directory.substr(1);
        }

        this.config.gamesDir = directory;

        this.writeConfig();
    }

    getGamePath(gameName) {
        return this.getGamesDirectory() + '/' + gameName;
    }

    getGameConfigPath(gameName) {
        return this.getGamesDirectory() + '/' + gameName + '/' + this.config.gameConfigName;
    }
}

module.exports = Settings;