const {BrowserWindow} = require('electron').remote;

var CurrentBrowserWindow = BrowserWindow.getAllWindows()[0];

class StatusService {
    constructor() {
    	this.status = false;
        this.renderStatus();

        this.messageField = $('.status-message');
        this.statusBar = $('.status');
        this.progressBar = $('.status-progress-bar');
    }

    setStatus(message) {
        this.status = message;
        this.renderStatus();
    }

    getStatus() {
        return this.status;
    }

    renderStatus(clear) {
        if (clear == true) {
            this.messageField.text('');
            this.statusBar.removeClass('active');
        } else if (this.messageField instanceof jQuery) {
            this.messageField.text(this.status);
            this.statusBar.addClass('active');
        }
    }

    downloadGame() {
        this.clearStatus();
        this.statusBar.addClass('active');
        this.downloadGameUpdate(0);
        this.progressBar.parent().addClass('active');
    }

    downloadGameUpdate(percent) {
        this.progressBar.width((percent * 100) + '%');
        this.progressBar.css('background-color', this.getProgressBarColor(percent));
        CurrentBrowserWindow.setProgressBar(percent);
    }

    extractGame() {
        CurrentBrowserWindow.setProgressBar(2);
        this.progressBar.css('background-color', '');
        this.progressBar.addClass('pulsate');
    }

    extractGameComplete() {
        CurrentBrowserWindow.setProgressBar(-1);
        this.hideStatus();
    }

    extractGameFailed() {
        CurrentBrowserWindow.setProgressBar(-1);
        this.hideStatus();
    }

    launchingGame(game) {
        Chat.alertLaunchingGame(game);

        this.setStatus('Playing ' + game.config.title);
    }

    closingGame(game) {
        Chat.alertClosingGame(game);

        this.clearStatus();
    }

    clearStatus() {
        this.status = false;
        this.renderStatus(true);
    }

    hideStatus() {
        this.clearStatus();
        this.progressBar.removeAttr('style').removeClass('pulsate');
        this.progressBar.parent().removeClass('active');
        this.statusBar.removeClass('active');
    }

    getProgressBarColor(value) {
        // Only accepts a floating value from 0-1 instead of a percentage
        var hue = (value * 120).toString(10);

        return 'hsl(' + hue + ', 100%, 50%)';
    }
}

module.exports = StatusService;