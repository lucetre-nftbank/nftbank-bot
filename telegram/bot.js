const TelegramBot = require('node-telegram-bot-api');
const auth = require('../public/auth.json');
const bot = new TelegramBot(auth.telegram_token, { polling: true });

const api = require("../public/api.js");
api.init();

function sendMessage(bot, channelID, message) {
    bot.sendMessage(channelID, message);
}

bot.on('message', (msg) => {
    const channelID = msg.chat.id;
    let message = msg.text;
    if (message.substring(0, 1) === '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
        args = args.splice(1);
        
        switch (cmd) {
            case 'price':
                if (args.length === 1 && args[0] === 'list') {
                    api.getPriceList(bot, channelID, sendMessage);
                } else {
                    api.getPrice(bot, channelID, args, sendMessage);
                }
                break;
            default:
                api.getHelp(bot, channelID, sendMessage);
                break;
        }
    }
});
