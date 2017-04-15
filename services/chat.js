const irc = require('irc');

class Chat {
    constructor() {
        this.getConnectionInfo();
    	this.connect();
        this.listenForActivationKey();

        this.chatContainer = $('.chat');
        this.messagesContainer = $('.chat-messages');
        this.userListContainer = $('.chat-users');
        this.messageBox = $('.chat-message-box input');

        this.activationKeyCode = 96 // ~

        addEventListener('settingsSaved', this.reconnect.bind(this));

        this.chatContainer.submit((e) => {
            e.preventDefault();

            this.sendMessage(this.messageBox.val());
            this.messageBox.val('');
        });
    }

    getConnectionInfo() {
        this._serverAddress = Settings.getSetting('chatServerAddress');
        this._serverPort = Settings.getSetting('chatServerPort');
        this._username = Settings.getSetting('username');
        this._channels = Settings.getSetting('chatChannels');
        this._chatLog = new Array();
        this.client;
    }

    connect() {
		this.client = new irc.Client(this._serverAddress, this._username, {
			channels: this._channels,
            port: this._serverPort
		});

        this.client.addListener('raw', function(message) {
            console.log(JSON.stringify(message));
        });

        this.client.addListener('message', (from, to, message) => {
            this.messageReceived(from, to, message);
        });

        this.client.addListener('action', (from, to, message) => {
            this.actionReceived(from, to, message);
        });

        this.registerUserListUpdates();

        this.client.addListener('error', function(message) {
            console.log('error: ', message);
        });
    }

    disconnect() {
        this.client.disconnect();
    }

    reconnect() {
        this.disconnect();
        this.getConnectionInfo();
        this.connect();
    }

    listenForActivationKey() {
        $(document).keypress((e) => {
            if (e.keyCode == this.activationKeyCode) {
                e.preventDefault();
                this.chatContainer.toggleClass('active');
                this.messageBox.focus();
            }
        });
    }

    registerUserListUpdates() {
        let updateEvents = [
            'JOIN',
            'NAMES',
            'QUIT',
            'KICK',
            'KILL',
            'NICK',
            'PART'
        ]

        this.client.addListener('raw', (message) => {
            if (updateEvents.indexOf(message.command) != -1) {
                this.displayUsers();
            }
        });
    }

    messageReceived(from, to, message) {
        this.appendMessage(from, to, message);
    }

    actionReceived(from, message) {
        this.appendAction(from, message);
    }

    enableChatMessageInteraction() {
        this.messagesContainer.find('game').each((i, gameLink) => {
            $(gameLink).unbind('click');

            var gameName = $(gameLink).attr('name');
            var serverAddress = $(gameLink).attr('server-address');
            var serverPort = $(gameLink).attr('server-port');

            $(gameLink).on('click', () => {
                GameList.games.forEach((game) => {
                    if (game._gameName == gameName) {
                        game.preFlightCheck(serverAddress, serverPort);
                    }
                });
            });
        });
    }

    appendMessage(from, to, message) {
        var messageToAppend = {
            from: from,
            to: to,
            message: message
        }

        this._chatLog.push(messageToAppend);
        var templateHtml = compileTemplate('#chat-message-template', messageToAppend);
        this.messagesContainer.append(templateHtml);
        this.messagesContainer.scrollTop(this.messagesContainer.get(0).scrollHeight);
        this.enableChatMessageInteraction();
    }

    appendAction(from, message) {
        var actionToAppend = {
            from: from,
            message: message
        }

        this._chatLog.push(actionToAppend);
        var templateHtml = compileTemplate('#chat-action-template', actionToAppend);
        this.messagesContainer.append(templateHtml);
        this.messagesContainer.scrollTop(this.messagesContainer.get(0).scrollHeight);
        this.enableChatMessageInteraction();
    }

    displayUsers() {
        Distribution.getUserList().then((channels) => {
            var firstChannel = JSON.parse(channels)[0];
            var templateHtml = compileTemplate('#chat-users-template', firstChannel);
            this.userListContainer.html(templateHtml);
        });
    }

    alertHostingGame(game, serverAddress, serverPort) {
        var gameLink = $('<game />', {
            'name': game._gameName,
            'server-address': serverAddress,
            'server-port': serverPort,
            text: game.config.title
        });

        this.sendAction('started a multiplayer game for ' + gameLink.get(0).outerHTML)
    }

    alertLaunchingGame(game) {
        this.sendAction('is playing ' + game.config.title);
    }

    alertClosingGame(game) {
        this.sendAction('stopped playing ' + game.config.title);
    }

    sendAction(message) {
        this._channels.forEach((channel) => {
            this.client.action(channel, message);
        });

        this.appendAction(this._username, message);
    }

    sendMessage(message) {
        this._channels.forEach((channel) => {
            this.client.say(channel, message);
        });

        this.appendMessage(this._username, null, message);
    }
}

module.exports = Chat;