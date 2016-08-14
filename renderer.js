const fs = require('fs');
const exec = require('child_process').exec;
const remote = require('electron').remote;

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

        		if (args[i].indexOf('%GAMEDIR%') != -1) {
        			args[i] = '"' + args[i].replace('%GAMEDIR%', gamePath) + '"';
        		}
        	});

        	command = command + ' ' + args.join(' ');
        }

    	log('Launching ' + command);

    	exec(command, {
    		cwd: gamePath
    	});
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

function enableWindowInteractionButtons() {
	$(document).ready(function() {
		var window = remote.getCurrentWindow();

		$('.window-action-button--maximize').on('click', function() {
			$('.window-action-button--maximize').addClass('hidden');
			$('.window-action-button--restore').removeClass('hidden');
			window.maximize();
		});

		$('.window-action-button--restore').on('click', function() {
			$('.window-action-button--maximize').removeClass('hidden');
			$('.window-action-button--restore').addClass('hidden');
			window.unmaximize();
		});

		$('.window-action-button--minimize').on('click', function() {
			window.minimize();
		});

		$('.window-action-button--close').on('click', function() {
			window.close();
		});

		$(window).on('resize', function() {
			$('.window-action-button--maximize').removeClass('hidden');
			$('.window-action-button--restore').addClass('hidden');
		});
	});
}

enableWindowInteractionButtons();
var games = updateGameList();
enableGameListInteractions();