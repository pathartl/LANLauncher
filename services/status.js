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

    renderStatus() {
        if (this.status != false) {
            this.messageField.text(this.status);
            this.statusBar.addClass('active');
        } else if (this.status != null) {
            //this.messageField.text('');
            //this.statusBar.removeClass('active');
        }
    }

    downloadingGame(percent) {
        this.progressBar.width((percent * 100) + '%');
    }

    launchingGame(game) {
        Chat.alertLaunchingGame(game);

        this.setStatus('Playing ' + game);
    }

    closingGame(game) {
        Chat.alertClosingGame(game);

        this.clearStatus();
    }

    clearStatus() {
        this.setStatus(false);
    }
}

module.exports = StatusService;