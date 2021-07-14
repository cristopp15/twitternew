'use strict'

var moongose = require('mongoose');
var Schema = moongose.Schema;

var tweetSchema = Schema({
    tweet: String
});

module.exports = moongose.model('tweet', tweetSchema);