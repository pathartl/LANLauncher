const fs = require('fs');
const http = require('http');
const extract = require('extract-zip');
const rimraf = require('rimraf');

class Game {
    constructor(gameName, config) {
        this._gameName = gameName;
        this._gameConfigPath = Settings.getGameConfigPath(this._gameName);
        this._gamePath = Settings.getGamePath(this._gameName);
        this._installed = this.isInstalled();

        if (_.isObject(config) && config.remoteFile === true) {
        	this.config = config;
        	if (config.coverFile != false) {
        		this._coverPath = Distribution.getServerUrl() + config.coverFile;
        	}
        } else {
        	this.config = this.getLocalGameConfig();
        	this._coverPath = this.getCoverPath();
        }
    }

    getLocalGameConfig() {
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

    	var gameTitle = this.config.title;
    	Status.launchingGame(gameTitle);

    	exec(command, {
    		cwd: gamePath
    	}, function() {
    		Status.closingGame(gameTitle);
    	});
    }

    isInstalled() {
    	var isInstalled = false;

    	try {
    		fs.statSync(this._gamePath);
    		fs.statSync(this._gamePath + '/game.json');
    		fs.statSync(this._gamePath + '/' + this.config.executable);

    		isInstalled = true;
    	} catch (err) {

    	}

    	return isInstalled;
    }

    installGame() {
    	this.downloadGame();
    }

    deleteGame() {
    	rimraf(this._gamePath, function(err) {
    		console.log('Error: ', err);
    		GameList.updateInstalledGameList();
    	});
    }

    createGameDirectory() {
    	fs.mkdirSync(this._gamePath);
    }

    extractGame() {
    	console.log('Extracting "' + this.config.title + '"...');
    	var source = this._gamePath + '/game.zip';
    	var target = this._gamePath;

    	Status.extractGame();

    	extract(source, {
    		dir: target
    	}, function(err) {
    		if (err) {
    			console.log('Failed extracting game!');
    			console.log(err);
    		} else {
    			console.log('Successfully extracted game!');
    			// Delete downloaded zip file to save on disk space
    			fs.unlinkSync(source);
    			Status.extractGameComplete();
    			GameList.updateInstalledGameList();
    		}
    	});
    }

    downloadGame(callback) {
    	var game = this;
    	var downloadUrl = Distribution.getServerUrl() + game.config.contentFile;
    	var gameTitle = game.config.title;

    	console.log('Downloading ' + gameTitle + ' from ' + downloadUrl);

    	try {
    		game.createGameDirectory();

    		try {
		    	var file = fs.createWriteStream(game._gamePath + '/game.zip');

		    	Status.downloadGame();

		    	var request = http.get(downloadUrl).on('response', function(response) {
		    		var length = parseInt(response.headers['content-length'], 10);
		    		var downloaded = 0;
		    		var startingPercentage = 0.05;
		    		var percentage = startingPercentage;

		    		response.on('data', function(chunk) {
		    			file.write(chunk);

		    			downloaded += chunk.length;

		    			percentage = downloaded / length;

		    			if (percentage > startingPercentage) {
		    				Status.downloadGameUpdate(downloaded / length);
		    			}
		    		}).on('end', function() {
		    			file.end();

		    			setTimeout(function() {
		    				game.extractGame();
		    			}, 2000);
		    		});
		    	});
    		} catch(err) {
    			console.log('Could not download game!');
    		}
    	} catch(err) {
    		console.log('Could not make game directory! - ' + game._gamePath);
    	}
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

	showGameOverlay(game) {
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

}

module.exports = Game;