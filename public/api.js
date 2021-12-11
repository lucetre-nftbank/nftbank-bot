const URL = 'https://api.nftbank.ai/estimates-v2';
const MAX_MSG_LEN = 2000;
const HEADERS = {'x-api-key': 'f307a05e605a2ae9d0ae965d66f96d43'};

var request = require('request-promise');
let contract_dict = {}

async function init() {
    var options = {
        headers: HEADERS,
        url: URL + '/dapp/list',
        method: 'GET'
    };

    await request(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body).data;
            
            for (let i = 0; i < data.length; i++) {
                contract_dict[data[i].dapp_info.id] = data[i].asset_contract;
            }
        }
    });
}

function getPriceList(bot, channelID, sendMessage)  {
    var options = {
        headers: HEADERS,
        url: URL + '/dapp/list',
        method: 'GET'
    };

    request(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body).data;
            
            let message = '';
            for (let i = 0; i < data.length; i++) {
                let id = data[i].dapp_info.id;
                let name = data[i].dapp_info.name;
                contract_dict[id] = data[i].asset_contract;
                let msg = '(' + (i+1) + ')\t' + name;
                if (message.length + msg.length > MAX_MSG_LEN) {
                    sendMessage(bot, channelID, message);
                    message = '';
                }
                message += msg + '\n';
            }
            sendMessage(bot, channelID, message);
        }
    });
}

function getHelp(bot, channelID, sendMessage) {
    sendMessage(bot, channelID, "Command Usage\n 1. `!price list`\n" + " 2. `!price <dapp_id> <token_id>`");
}

async function getPrice(bot, channelID, args, sendMessage) {
    if (args.length != 2) {
        getHelp(bot, channelID, sendMessage);
        return;
    }

    let dappID = args[0];
    let tokenID = args[1];

    if (!(dappID in contract_dict)) {
        await init();
        if (!(dappID in contract_dict)) {
            sendMessage(bot, channelID, "No corresponding `dapp_id`.");
            getHelp(bot, channelID, sendMessage);
            return;
        }
    }

    var options = {
        headers: HEADERS,
        url: URL + '/estimates/' + contract_dict[dappID] + '/' + tokenID,
        method: 'GET'
    };

    request(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body).data;
            if (data.length == 0) {
                sendMessage(bot, channelID, "No corresponding `token_id` in `" + dappID + "`.");
                getHelp(bot, channelID, sendMessage);
                return;
            }
            let estimate = data[0].estimate;
            let message = '';
            for (let i = 0; i < estimate.length; i++) {
                let currency = estimate[i].currency_symbol;
                let price = estimate[i].estimate_price;
                message += '`' + currency + ' ' + price + '`\n';
            }
            sendMessage(bot, channelID, message);
        }
    });
}


module.exports = { getPrice, getPriceList, getHelp, init };