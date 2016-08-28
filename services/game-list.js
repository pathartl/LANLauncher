const fs = require('fs');
const Game = require('../models/game.js');

const {remote} = require('electron');
const {Menu, MenuItem} = remote;

class GameListService {
    constructor(gameName) {
        this.games = new Array();
        this.gameNames = new Array();
        this.genres = new Array();
        this.years = new Array();
        this.maxPlayerNums = new Array();
        this.gameFilter = {};
    }

	listInstalledGames() {
		var gameNames = new Array();
	    console.log(Settings.getGamesDirectory());

	    var directories = fs.readdirSync(Settings.getGamesDirectory());

	    directories.forEach(function(file) {
	        if (fs.statSync(Settings.getGamePath(file)).isDirectory()) {
	            try {
	                fs.statSync(Settings.getGameConfigPath(file));
	                gameNames.push(file);
	            }

	            catch (e) {
	                console.log('Not a valid game: ' + file);
	            }
	        }
	    });

	    this.gameNames = gameNames;
	}

	sortGamesAlphabetically() {
		this.games = _.orderBy(this.games, function(game) {
			if (typeof game.config.sortTitle == 'string' && game.config.sortTitle.length > 0) {
				return game.config.sortTitle;
			} else {
				return game.config.title;
			}
		}, ['asc']);
	}

	enableGameListInteractions() {
		var games = this.games;

		$('.game-list .game').on('dblclick', function() {
			var gameName = $(this).attr('game-name');

			games.forEach(function(game) {
				if (game._gameName == gameName) {
					if (game.isInstalled()) {
						game.launchGame();
					} else {
						game.installGame();
					}
				}
			});
		// }).on('click', function() {
		// 	var gameName = $(this).attr('game-name');

		// 	games.forEach(function(game) {
		// 		if (game._gameName == gameName) {
		// 			showGameOverlay(game);
		// 		}
		// 	});
		});

		$('.game-list .game').on('contextmenu', function() {

			var gameName = $(this).attr('game-name');

			var gameContextMenu = new Menu();

			games.forEach(function(game) {

				if (game._gameName == gameName) {
					if (game.isInstalled()) {
						gameContextMenu.append(new MenuItem({
							label: 'Delete Game',
							click: () => {
								game.deleteGame();
							}
						}));
					}
				}
			});

			gameContextMenu.popup(remote.getCurrentWindow());
		});
	}



	renderGameList(filteredGames) {
		var games = this.games;

		if (_.isArray(filteredGames)) {
			games = filteredGames;
		}

		var templateHtml = compileTemplate('#game-list-template', {games: games});

		$('.game-list').html(templateHtml);

		this.enableGameListInteractions();
	}


	updateGameList(gameConfigs) {
		var games = new Array();

		if (_.isArray(gameConfigs)) {
			gameConfigs.forEach(function(gameConfig) {
				games.push(new Game(gameConfig.folderName, gameConfig));
			});
		} else {
			this.gameNames.forEach(function(gameName) {
			    games.push(new Game(gameName));
			});
		}

		this.games = games;
		this.sortGamesAlphabetically();
		this.renderGameList();
		this.renderGameFilter();
		this.enableFilterInteraction();
	}

	updateInstalledGameList() {
		this.games.forEach(function(game) {
			game._installed = game.isInstalled();
		});

		this.renderGameList();
	}

	getAllGameGenres() {
		var genres = new Array();

		this.games.forEach(function(game) {
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

		this.genres = _.sortBy(genres, 'value');
	}

	getAllGameYears() {
		var years = new Array();

		this.games.forEach(function(game) {
			if (_.isNumber(game.config.year)) {
				years.push({value: game.config.year});
			}
		});

		years = _.uniqBy(years, 'value');

		this.years = _.sortBy(years, 'value');
	}

	getAllGamePlayerNums() {
		var nums = new Array();

		this.games.forEach(function(game) {
			if (_.isNumber(game.config.multiplayer.players)) {
				nums.push({value: game.config.multiplayer.players});
			}
		});

		nums = _.uniqBy(nums, 'value');

		this.maxPlayerNums = _.sortBy(nums, 'value');
	}

	renderGameFilter() {
		this.getAllGameYears();
		this.getAllGameGenres();
		this.getAllGamePlayerNums();

		var filter = [
			{
				title: 'Year',
				name: 'year',
				type: 'select',
				options: this.years
			},
			{
				title: 'Genre',
				name: 'genre',
				type: 'select',
				options: this.genres
			},
			{
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
			},
			{
				title: 'Number of Players',
				name: 'players',
				type: 'select',
				options: this.maxPlayerNums
			}
		];

		var templateHtml = compileTemplate('#game-filter-template', {filters: filter})
		console.log(templateHtml);

		$('.game-filter').html(templateHtml);
	}

	filterGamesByYear(games, year) {
		return games.filter(function(game) {
			return game.config.year == year || year == '';
		});
	}

	filterGamesByGenre(games, genre) {
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

	filterGamesByMultiplayerType(games, types) {
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

	filterGamesByPlayers(games, players) {
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

	filterGames() {
		var filteredGames = this.games;
		var gameFilter = this.gameFilter;

		_.forOwn(gameFilter, function(value, filterName) {
			switch (filterName) {
				case 'year':
					filteredGames = GameList.filterGamesByYear(filteredGames, value);
				break;

				case 'genre':
					filteredGames = GameList.filterGamesByGenre(filteredGames, value);
				break;

				case 'multiplayer-type':
					filteredGames = GameList.filterGamesByMultiplayerType(filteredGames, value);
				break;

				case 'players':
					filteredGames = GameList.filterGamesByPlayers(filteredGames, value);
				break;
			}
		});

		this.filteredGames = filteredGames;
		this.renderGameList(filteredGames);
	}

	enableFilterInteraction() {
		var filters = $('.filter');
		var gameFilter = this.gameFilter;

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

				GameList.gameFilter[name] = value;


				GameList.filterGames();

				console.log(gameFilter);
			});
		});
	}

}

module.exports = GameListService;