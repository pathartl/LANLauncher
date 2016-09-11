const fs = require('fs');
const os = require('os');

class Settings {
    constructor() {
        this.config = {};
        this.configPath = process.cwd() + '/config.json';
        this.loadConfig();
        this.networkInterfaces = this.getNetworkInterfaces();
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

    getNetworkInterfaces() {
        return os.networkInterfaces();
    }

    getFirstValidIPAddress() {
        var blacklistedNetworkInterfaceSubstrings = [
            'VirtualBox',
            'Pseudo-Interface'
        ]

        var networkInterface = false;

        _.forOwn(this.networkInterfaces, (interfaceTypes, interfaceName) => {
            blacklistedNetworkInterfaceSubstrings.forEach((substring) => {
                if (interfaceName.indexOf(substring) != -1 && networkInterface === false) {
                    networkInterface = interfaceTypes;
                }
            });
        });

        return this.getIPV4Address(networkInterface);
    }

    getIPV4Address(networkInterface) {
        var ip = '0.0.0.0';

        networkInterface.forEach((interfaceInfo) => {
            if (interfaceInfo.family == 'IPv4') {
                ip = interfaceInfo.address;
            } 
        });

        return ip;
    }

    getLocalIP() {
        return this.getFirstValidIPAddress();
    }

    openSettingsUI() {
        this.loadConfig();
        this.renderSettingsUI();

        $('.settings-overlay').show().addClass('active');
    }

    renderSettingsUI() {
        var config = this.config;

        _.forOwn(config, function(value, key) {
            if (key == 'chatChannels' && _.isArray(value)) {
                config.chatChannels = value.join(', ');
            }
        });

        var templateHtml = compileTemplate('#settings-overlay-template', config);
        $('.settings-overlay').html(templateHtml);
    }

    saveSettingsUI(e) {
        e.preventDefault();

        this.updateConfigUI();
        this.writeConfig();

        var event = new Event('settingsSaved');

        dispatchEvent(event);

        this.closeSettingsUI();
    }

    updateConfigUI() {
        var config = this.config;

        $('form[name="settings"] [name]').each(function(i, setting) {
            setting = $(setting);
            config[setting.attr('name')] = setting.val();
        });

        _.forOwn(config, function(value, key) {
            if (key == 'chatChannels' && _.isString(value)) {
                config.chatChannels = value.split(', ');
            }
        });

        this.config = config;
    }

    toggleAdvancedSettings(e) {
        this.updateConfigUI();
        this.setSetting('advancedSettingsEnabled', $(e.target).prop('checked'));
        this.renderSettingsUI();
    }

    closeSettingsUI() {
        $('.settings-overlay').removeClass('active').hide();
    }
}

module.exports = Settings;