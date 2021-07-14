'use strict'

var jwt = require('jwt-simple');
var moment = require('moment');
var key = 'TWITTER123';

exports.createToken = (user)=>{
    var payload = {
        sub: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        iat: moment().unix(),
        exp: moment().add(15, "minutes").unix()
    }
    return jwt.encode(payload, key);
}