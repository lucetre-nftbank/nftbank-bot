
const auth = require('../public/auth.json');
const Twitter = require('twitter');
const cron = require("node-cron");
const api = require("../public/api.js");

const twitterClient = new Twitter({
    consumer_key: auth.TWITTER_CONSUMER_KEY,
    consumer_secret: auth.TWITTER_CONSUMER_SECRET,
    access_token_key: auth.TWITTER_ACCESS_KEY,
    access_token_secret: auth.TWITTER_ACCESS_SECRET,
});

const createPost = async () => {
    let topk_punks = await api.getTopKPunks();
    
    let post = 'Top 10 Punks (ETH)\n';
    for (let i = 0; i < topk_punks.length; i++) {
        post += ('    `' + topk_punks[i][0] + '`').slice(-6);
        post += ':' + parseInt(topk_punks[i][1]) + '\n';
    }
    console.log(post);

    if (topk_punks.length) {
        twitterClient.post(
            'statuses/update',
            { status: post },
            function (error, tweet, response) {
                if (!error) {
                    console.log(tweet);
                }
                else {
                    console.log(error);
                }
            }
        );
    }
};

const task = cron.schedule(
    "00 13 * * *",
    createPost, 
    { scheduled: false }
);

task.start();