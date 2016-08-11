class Settings {
    constructor() {
        this.config = {};
        this.loadConfig();
    }

    loadConfig() {
        var path = __dirname + '/config.json';
        var defaults = this.getDefaultConfig();

        try {
            // Try to load config from file
            fs.openSync(path, 'r+');

            var data = fs.readFileSync(path);

            this.config = JSON.parse(data);
        } catch (err) {
            // If errored, try making config and write the defaults
            try {
                var fd = fs.openSync(path, 'w+');

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
            fs.writeFileSync(path, JSON.stringify(this.config, null, 4));

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
    }

    setGamesDirectory(directory) {
        if (directory.indexOf('./') === 0) {
            directory = __dirname + directory.substr(1);
        }

        this.config.gamesDir = directory;

        this.writeConfig();
    }

    getGamePath(gameName) {
        return this.config.gamesDir + '/' + gameName;
    }

    getGameConfigPath(gameName) {
        return this.config.gamesDir + '/' + gameName + '/' + this.config.gameConfigName;
    }
}

module.exports = Settings;