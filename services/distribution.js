const request = require('request-promise');
const fs = require('fs');

class DistributionService {
    constructor() {
        this.getServerInformation();
        addEventListener('settingsSaved', this.reloadMasterGameList.bind(this));
    }

    getServerInformation() {
        this._serverAddress = Settings.getSetting('serverAddress');
        this._serverPort = Settings.getSetting('serverPort');
        this._serverUrl = 'http://' + this._serverAddress + ':' + this._serverPort;
        this._masterGameListPath = this._serverUrl + '/games.json';
        this._masterUserListPath = this._serverUrl + '/users.json';
        this._masterGameList = new Array();
    }

    getMasterGameList() {
    	return request(this._masterGameListPath).then((body) => {
    			this._masterGameList = JSON.parse(body);
    			GameList.updateGameList(this._masterGameList);
    	})
        .catch((err) => {
                GameList.listInstalledGames();
                GameList.updateGameList();
        });
    }

    getUserList() {
        return request(this._masterUserListPath);
    }

    reloadMasterGameList() {
        this.getServerInformation();
        this.getMasterGameList();
    }

    getServerUrl() {
    	return this._serverUrl;
    }

}

module.exports = DistributionService;