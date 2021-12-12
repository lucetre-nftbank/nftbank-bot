const auth = require('./auth.json');

const URL = 'https://api.nftbank.ai/estimates-v2';
const MAX_MSG_LEN = 2000;
const HEADERS = {'x-api-key': auth.nftbank_token};

var request = require('request-promise');
let contract_dict = {}
let query_log = []
let query_dict = {}

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
    let query = '/dapp/list';
    var options = {
        headers: HEADERS,
        url: URL + query,
        method: 'GET'
    };

    request(options, async (error, response, body) => {
        if (!error && response.statusCode == 200) {
            query_log.push(query);

            var data = JSON.parse(body).data;
            
            let message = '';
            for (let i = 0; i < data.length; i++) {
                let id = data[i].dapp_info.id;
                let name = data[i].dapp_info.name;

                contract_dict[id] = data[i].asset_contract;

                let msg = '(' + (i+1) + ')\t' + name;
                if (message.length + msg.length > MAX_MSG_LEN) {
                    await sendMessage(bot, channelID, message);
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

    let query = '/estimates/' + contract_dict[dappID] + '/' + tokenID;
    var options = {
        headers: HEADERS,
        url: URL + query,
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

            query_log.push(query);
            if (!(dappID in query_dict)) {
                query_dict[dappID] = {}
            }
            if (!(tokenID in query_dict[dappID])) {
                query_dict[dappID][tokenID] = 0;
            }
            query_dict[dappID][tokenID]++;

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

async function getLog(bot, channelID, sendMessage)  {
    let message = '';
    if (!query_log.length) {
        sendMessage(bot, channelID, "No queries.");
        return;
    }
    for (let i = 0; i < query_log.length; i++) {
        let msg = '(' + (i+1) + ')\t' + query_log[i];
        if (message.length + msg.length > MAX_MSG_LEN) {
            await sendMessage(bot, channelID, message);
            message = '';
        }
        message += msg + '\n';
    }
    sendMessage(bot, channelID, message);
}

async function getStat(bot, channelID, sendMessage)  {
    let message = '';
    if (!Object.keys(query_dict).length) {
        sendMessage(bot, channelID, "No queries.");
        return;
    }
    console.log(query_dict);
    for (let dapp in query_dict) {
        let msg = dapp + '\n';
        for (let token in query_dict[dapp]) {
            msg += '  `' + token + "` : " + query_dict[dapp][token] + '\n';
        }
        if (message.length + msg.length > MAX_MSG_LEN) {
            await sendMessage(bot, channelID, message);
            message = '';
        }
        message += msg + '\n';
    }
    sendMessage(bot, channelID, message);
}

let topk_punks = [];
async function getTopKPunks(k = 10) {
    const MAX_PUNK_ID = 10000;
    let token_ids = [];
    for (let i = 1; i < MAX_PUNK_ID; i++) {
        token_ids.push(String(i));
    }

    var options = {
        headers: HEADERS,
        url: URL + '/estimates/bulk',
        method: 'POST',
        body: {
            asset_contract: "0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb",
            token_ids: token_ids,
            chain_id: "ETHEREUM"
        },
        json:true
    };

    await request.post(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
            let data = body.data;
            let punk_dict = {};

            for (let i = 0; i < data.length; i++) {
                let eth_price = 0.0;
                for (let j = 0; j < data[i].estimate.length; j++) {
                    let estimate = data[i].estimate[j];
                    if (estimate.currency_symbol == 'ETH') {
                        eth_price = estimate.estimate_price;
                        break;
                    }
                }
                punk_dict[data[i].token_id] = eth_price;
            }

            var items = Object.keys(punk_dict).map(function (key) {
                return [key, punk_dict[key]];
            });
            items.sort((first, second) => {
                return second[1] - first[1];
            });
            topk_punks = items.slice(0, k);
        }
    });
    return topk_punks;
}

module.exports = { init, getPrice, getPriceList, getHelp, getLog, getStat, getTopKPunks };