class NotificationService {
    constructor() {
    }

    extractGameComplete(game) {
        let notification = new Notification('Installation Complete', {
            body: game.config.title + ' has been successfully installed'
        });
    }

}

module.exports = NotificationService;