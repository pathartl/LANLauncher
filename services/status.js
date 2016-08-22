class StatusService {
    constructor() {
    	this.status = false;
        this.renderStatus();
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
            $('.status-message').text(this.status);
            $('.status').addClass('active');
        } else {
            $('.status-message').text('');
            $('.status').removeClass('active');
        }
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