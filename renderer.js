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
var Status = new StatusService();

var NotificationService = require('./services/notifications.js');
var Notify = new NotificationService();

var Alert = require('./services/alert.js');

console.log(Status);

var DistributionService = require('./services/distribution.js');
var Distribution = new DistributionService();

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

		$('.window-action-button--settings').on('click', function() {
			Settings.openSettingsUI();
		});

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
			Chat.disconnect();
			window.close();
		});

		$(window).on('resize', function() {
			$('.window-action-button--maximize').removeClass('hidden');
			$('.window-action-button--restore').addClass('hidden');
		});
	});
}

enableWindowInteractionButtons();
Distribution.getMasterGameList();