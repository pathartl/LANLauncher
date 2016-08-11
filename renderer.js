const fs = require('fs');
const exec = require('child_process').execFile;

var Settings = require('./settings.js');
var settings = new Settings();

const gamesDir = __dirname + '/games';
const configName = 'game.json';

class Game {
    constructor(gameName) {
        this._gameName = gameName;
        this._gameConfigPath = settings.getGameConfigPath(this._gameName);
        this._gamePath = settings.getGamePath(this._gameName);
        this.config = this.getGameConfig();
    }

    getGameConfig() {
        //try {
            fs.openSync(this._gameConfigPath, 'r+');

            var data = fs.readFileSync(this._gameConfigPath, 'utf8');

            console.log(data);

            return JSON.parse(data);
        // } catch (err) {
        //     console.log('Error: Could not read game config file located at ' + this._gameConfigPath);
        // }
    }

    launchGame() {
        var command = this._gamePath + '/' + this.config.executable;
        log('Launching ' + command);
        exec(command);
    }
}

function log(string) {
    // Add actual log output to file
    console.log(string);
}

function listInstalledGames() {
    var games = new Array();

    console.log(settings.getGamesDirectory());

    var directories = fs.readdirSync(settings.getGamesDirectory());

    directories.forEach(function(file) {
        if (fs.statSync(settings.getGamePath(file)).isDirectory()) {
            try {
                fs.statSync(settings.getGameConfigPath(file));

                log('Game found: ' + file);
                games.push(file);
            }

            catch (e) {
                log('Not a valid game: ' + file);
            }
        }
    });

    return games;
}

var games = new Array();
var gameNames = listInstalledGames();

gameNames.forEach(function(gameName) {
    games.push(new Game(gameName));
});

games.forEach(function(game, i) {
	console.log(game.config.title);
	var gameLink = $('<div />', {
		'class': 'game',
		'game': game.config.title,
		text: game.config.title
	});

	gameLink.on('click', function() {
		game.launchGame();
	});

	$('.game-list').append(gameLink);
});