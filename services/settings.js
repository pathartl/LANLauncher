const fs = require('fs');

class Settings {
    constructor() {
        this.config = {};
        this.configPath = process.cwd() + '/config.json';
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
            "gameConfigFilename": "game.json",
            "gamesDirectory": "./games",
            "chatChannels": ["#lanlauncher"],
            "username": "LANLauncherClient",
            "serverAddress": "localhost",
            "serverPort": 9494,
            "chatServerAddress": "localhost",
            "chatServerPort": 6667
        }
    }

    getSetting(setting) {
        return this.config[setting];
    }

    setSetting(key, value) {
        this.config[key] = value;
    }

    getGamesDirectory() {
        var directory = this.config.gamesDirectory;

        if (directory.indexOf('./') === 0) {
            directory = process.cwd() + directory.substr(1);
        }

        return directory;
    }

    setGamesDirectory(directory) {
        if (directory.indexOf('./') === 0) {
            directory = process.cwd() + directory.substr(1);
        }

        this.config.gamesDirectory = directory;

        this.writeConfig();
    }

    getGamePath(gameName) {
        return this.getGamesDirectory() + '/' + gameName;
    }

    getGameConfigPath(gameName) {
        return this.getGamesDirectory() + '/' + gameName + '/' + this.config.gameConfigFilename;
    }

    }
}

module.exports = Settings;