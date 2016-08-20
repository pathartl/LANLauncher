const fs = require('fs');
const exec = require('child_process').exec;
const remote = require('electron').remote;

var Settings = require('./settings.js');
var settings = new Settings();

const Handlebars = require('handlebars');
const _ = require('lodash');

const gamesDir = __dirname + '/games';
const configName = 'game.json';

Handlebars.registerHelper('equals', function (a, b, opts) {
	if (a == b) {
		return opts.fn(this);
	} else {
		return opts.inverse(this);
	}
});

class Game {
    constructor(gameName) {
        this._gameName = gameName;
        this._gameConfigPath = settings.getGameConfigPath(this._gameName);
        this._gamePath = settings.getGamePath(this._gameName);
        this.config = this.getGameConfig();

        this._coverPath = this.getCoverPath();
    }

    getGameConfig() {
        try {
        	// Make sure we can open it for read
            var fd = fs.openSync(this._gameConfigPath, 'r+');
            // Close!
            fs.closeSync(fd);

            var data = fs.readFileSync(this._gameConfigPath, 'utf8');

            console.log(data);

            return JSON.parse(data);
        } catch (err) {
            console.log('Error: Could not read game config file located at ' + this._gameConfigPath);
        }
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

    launchServer(port) {
    	var gamePath = this._gamePath;
    	var command = '"' + gamePath + '/' + this.config.multiplayer.server.executable + '"';

    	if (Array.isArray(this.config.multiplayer.server.arguments)) {
        	var args = this.config.multiplayer.server.arguments;

        	args.forEach(function(arg, i) {
        		if (args[i].indexOf('%PORT%') != -1) {
        			console.log(port);
        			args[i] = args[i].replace('%PORT%', port);
        		}
        	});

        	command = command + ' ' + args.join(' ');
        }

        log('Starting server ' + command);

        exec(command, {
        	cwd: gamePath
        });
    }

    joinServer(ip, port) {
    	var gamePath = this._gamePath;
    	var command = '"' + gamePath + '/' + this.config.multiplayer.client.executable + '"';

    	if (Array.isArray(this.config.multiplayer.client.arguments)) {
        	var args = this.config.multiplayer.client.arguments;

        	args.forEach(function(arg, i) {
        		if (args[i].indexOf('%PORT%') != -1) {
        			args[i] = args[i].replace('%PORT%', port);
        		}

        		if (args[i].indexOf('%IP%') != -1) {
        			args[i] = args[i].replace('%IP%', ip);
        		}
        	});

        	command = command + ' ' + args.join(' ');
        }

        log('Joining server ' + command);

        exec(command, {
        	cwd: gamePath
        });
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

function showGameOverlay(game) {
	var templateHtml = compileTemplate('#game-launch-overlay-template', {game: game});

	$('.game-launch-overlay').html(templateHtml).show();

	$('.game-launch-overlay [name="launch-server"]').click(function() {
		game.launchServer($('.game-launch-overlay [name="server-port"]').val());
	});

	$('.game-launch-overlay [name="launch-client"]').click(function() {
		var ip = $('.game-launch-overlay [name="client-ip"]').val();
		var port = $('.game-launch-overlay [name="client-port"]').val();
		game.joinServer(ip, port);
	});
}

function enableGameListInteractions() {
	$('.game-list .game').on('dblclick', function() {
		var gameName = $(this).attr('game-name');

		games.forEach(function(game) {
			if (game._gameName == gameName) {
				game.launchGame();
			}
		});
	}).on('click', function() {
		var gameName = $(this).attr('game-name');

		games.forEach(function(game) {
			if (game._gameName == gameName) {
				showGameOverlay(game);
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

	renderGameList(games);

	return games;
}

function renderGameList(games) {
	var templateHtml = compileTemplate('#game-list-template', {games: games});

	$('.game-list').html(templateHtml);

	enableGameListInteractions();
}

function getAllGameYears() {
	var years = new Array();

	games.forEach(function(game) {
		if (_.isNumber(game.config.year)) {
			years.push({value: game.config.year});
		}
	});

	years = _.uniqBy(years, 'value');

	return _.sortBy(years, 'value');
}

function getAllGameGenres() {
	var genres = new Array();

	games.forEach(function(game) {
		if (_.isArray(game.config.genre)) {
			genres = _.concat(genres, game.config.genre);
		} else if (_.isString(game.config.genre)) {
			genres.push(game.config.genre);
		}
	});

	// Make it fit our needs for Handlebars
	genres.forEach(function(genre, i) {
		genres[i] = {value: genre}
	});

	genres = _.uniqBy(genres, 'value');

	return _.sortBy(genres, 'value');
}

function getAllGamePlayerNums() {
	var nums = new Array();

	games.forEach(function(game) {
		if (_.isNumber(game.config.multiplayer.players)) {
			nums.push({value: game.config.multiplayer.players});
		}
	});

	nums = _.uniqBy(nums, 'value');

	return _.sortBy(nums, 'value');
}

function renderGameFilter() {
	var filter = new Array();

	filter.push({
		title: 'Year',
		name: 'year',
		type: 'select',
		options: getAllGameYears()
	});

	filter.push({
		title: 'Genre',
		name: 'genre',
		type: 'select',
		options: getAllGameGenres()
	});

	filter.push({
		title: 'Multiplayer Type',
		name: 'multiplayer-type',
		type: 'checkbox',
		options: [
			{
				name: 'TCP/IP',
				value: 'tcpip'
			},
			{
				name: 'IPX',
				value: 'ipx'
			},
			{
				name: 'Local',
				value: 'local'
			}
		]
	});

	filter.push({
		title: 'Number of Players',
		name: 'players',
		//type: 'range',
		type: 'select',
		options: getAllGamePlayerNums()
	});

	var templateHtml = compileTemplate('#game-filter-template', {filters: filter})
	console.log(templateHtml);

	$('.game-filter').html(templateHtml);
}

function filterGamesByYear(games, year) {
	return games.filter(function(game) {
		return game.config.year == year || year == '';
	});
}

function filterGamesByGenre(games, genre) {
	return games.filter(function(game) {
		if (genre == '') {
			return true;
		} else if (game.config.genre.indexOf(genre) != -1) {
			return true;
		} else {
			return false;
		}
	});
}

function filterGamesByMultiplayerType(games, types) {
	return games.filter(function(game) {
		var typeIsIncluded = false;

		if (types.length == 0) {
			typeIsIncluded = true
		} else {
			types.forEach(function(type) {
				try {
					if (game.config.multiplayer.type[type] == true) {
						typeIsIncluded = true;
					}
				} catch(err) {
				}
			});
		}

		return typeIsIncluded;
	});
}

function filterGamesByPlayers(games, players) {
	return games.filter(function(game) {
		if (players == '') {
			return true;
		} else if (game.config.multiplayer.players >= parseInt(players)) {
			return true;
		} else {
			return false;
		}
	});
}

function filterGames() {
	var filteredGames = games;

	_.forOwn(gameFilter, function(value, filterName) {
		switch (filterName) {
			case 'year':
				filteredGames = filterGamesByYear(filteredGames, value);
				console.log(filteredGames);
			break;

			case 'genre':
				filteredGames = filterGamesByGenre(filteredGames, value);
				console.log(filteredGames);
			break;

			case 'multiplayer-type':
				filteredGames = filterGamesByMultiplayerType(filteredGames, value);
				console.log(filteredGames);
			break;

			case 'players':
				filteredGames = filterGamesByPlayers(filteredGames, value);
				console.log(filteredGames);
			break;
		}
	});

	renderGameList(filteredGames);
}

function enableFilterInteraction() {
	var filters = $('.filter');

	console.log(filters);

	filters.each(function(i, filter) {
		var inputs = $(filter).find('input, select');
		var name = $(filter).attr('name');

		$(inputs).on('change', function() {
			var value = new Array();
			inputs.each(function(i, input) {
				if ($(input).attr('type') == 'checkbox') {
					if ($(input).prop('checked')) {
						value.push($(input).attr('name'));
					}
				} else {
					value = $(input).val();
				}
			});

			gameFilter[name] = value;

			filterGames();

			console.log(gameFilter);
		});
	});
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
var gameFilter = {};
renderGameFilter();
enableFilterInteraction();