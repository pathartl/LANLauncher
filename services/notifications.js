class NotificationService {
    constructor() {
    }

    extractGameComplete(game) {
        let notification = new Notification('Installation Complete', {
            body: game.config.title + ' has been successfully installed'
        });
    }

    extractGameFailed(game) {
    	let notification = new Notification('Installation Failed', {
    		body: game.config.title + ' could not be installed'
    	});
    }

}

module.exports = NotificationService;