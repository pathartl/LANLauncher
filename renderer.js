const fs = require('fs');
const exec = require('child_process').exec;
const remote = require('electron').remote;

var SettingsService = require('./services/settings.js');
var Settings = new SettingsService();

var GameListService = require('./services/game-list.js');
var GameList = new GameListService();

const Handlebars = require('handlebars');
const _ = require('lodash');

const gamesDir = __dirname + '/games';
const configName = 'game.json';

var ChatService = require('./services/chat.js');
var Chat = new ChatService();

var StatusService = require('./services/status.js');
var Status = new StatusService;

Handlebars.registerHelper('equals', function (a, b, opts) {
	if (a == b) {
		return opts.fn(this);
	} else {
		return opts.inverse(this);
	}
});

function log(string) {
    // Add actual log output to file
    console.log(string);
}



function compileTemplate(templateSelector, data) {
	var source = $(templateSelector).html();
	var template = Handlebars.compile(source);

	var html = template(data);

	return html;
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
GameList.updateGameList();
GameList.renderGameFilter();
GameList.enableFilterInteraction();