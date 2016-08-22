const irc = require('irc');

class Chat {
    constructor() {
    	this._server = Settings.getSetting('chatServer');
    	this._username = Settings.getSetting('username');
    	this._channels = Settings.getSetting('chatChannels');
    	this.client;

    	this.connect();

		this.client.addListener('message', function (from, to, message) {
	    	console.log(from + ' => ' + to + ': ' + message);
		});
    }

    connect() {
		this.client = new irc.Client(this._server, this._username, {
			channels: this._channels
		});
    }

    alertLaunchingGame(game) {
    	this.client.action(this._channels[0], 'is playing ' + game);
    }

    alertClosingGame(game) {
    	this.client.action(this._channels[0], 'stopped playing ' + game);
    }

    sendMessage(message) {
    	this.client.say(this._channels[0], message);
    }
}

module.exports = Chat;