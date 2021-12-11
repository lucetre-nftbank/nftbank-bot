const Discord = require('discord.io');
const logger = require('winston');

const auth = require('../public/auth.json');
const api = require("../public/api.js");
api.init();

logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

var bot = new Discord.Client({
    token: auth.discord_token,
    autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});

function sendMessage(bot, channelID, message) {
    bot.sendMessage({
        to: channelID,
        message: message
    });
}

bot.on('message', function (user, userID, channelID, message, evt) {
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