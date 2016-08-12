const fs = require('fs');
const exec = require('child_process').exec;

var Settings = require('./settings.js');
var settings = new Settings();

const Handlebars = require('handlebars');
const _ = require('lodash');

const gamesDir = __dirname + '/games';
const configName = 'game.json';

class Game {
    constructor(gameName) {
        this._gameName = gameName;
        this._gameConfigPath = settings.getGameConfigPath(this._gameName);
        this._gamePath = settings.getGamePath(this._gameName);
        this.config = this.getGameConfig();

        this._coverPath = this.getCoverPath();
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
    	var gamePath = this._gamePath;
        var command = '"' + gamePath + '/' + this.config.executable + '"';

        if (Array.isArray(this.config.arguments)) {
        	var args = this.config.arguments;

        	args.forEach(function(arg, i) {
        		if (arg.indexOf('./') == 0) {
        			args[i] = '"' + gamePath + arg.substr(1) + '"';
        		}

        		args[i] = args[i].replace('%GAMEDIR%', '"' + gamePath + '"');
        	});

        	command = command + ' ' + args.join(' ');
        }
        
    	log('Launching ' + command);

    	exec(command);
    }

    getCoverPath() {
    	try {
    		fs.statSync(this._gamePath + '/cover.jpg');
    		return 'file://' + this._gamePath + '/cover.jpg';
    	} catch (err) {
    		return false;
    	}
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

function compileTemplate(templateSelector, data) {
	var source = $(templateSelector).html();
	var template = Handlebars.compile(source);

	var html = template(data);

	return html;
}

function sortGamesAlphabetically(games) {
	return _.orderBy(games, function(game) {
		if (typeof game.config.sortTitle == 'string' && game.config.sortTitle.length > 0) {
			return game.config.sortTitle;
		} else {
			return game.config.title;
		}
	}, ['asc']);
}

function enableGameListInteractions() {
	$('.game-list .game').on('dblclick', function() {
		var gameName = $(this).attr('game-name');

		games.forEach(function(game) {
			if (game._gameName == gameName) {
				game.launchGame();
			}
		});
	});
}

function updateGameList() {
	var games = new Array();
	var gameNames = listInstalledGames();

	gameNames.forEach(function(gameName) {
	    games.push(new Game(gameName));
	});

	games = sortGamesAlphabetically(games);

	var templateHtml = compileTemplate('#game-list-template', {games: games});
	console.log(templateHtml);

	$('.game-list').html(templateHtml);

	return games;
}

var games = updateGameList();
enableGameListInteractions();
