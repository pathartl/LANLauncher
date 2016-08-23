const request = require('request');
const fs = require('fs');

class DistributionService {
    constructor() {
    	this._server = Settings.getSetting('server');
    	this._serverUrl = 'http://' + this._server;
    	this._masterGameListPath = this._serverUrl + '/games.json';
    	this._masterGameList = new Array();
    }

    getMasterGameList() {
    	console.log('Getting master game list from server');
    	request(this._masterGameListPath, function(error, response, body) {
    		if (!error && response.statusCode == 200) {
    			this._masterGameList = JSON.parse(body);

    			GameList.updateGameList(this._masterGameList);
    		} else {
    			GameList.updateGameList(GameList.listInstalledGames())
    		}
    	});
    }

    getServerUrl() {
    	return this._serverUrl;
    }

}

module.exports = DistributionService;