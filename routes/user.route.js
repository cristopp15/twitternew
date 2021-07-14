'use strict'

var express = require('express');
var UserController = require('../controllers/user.controller');
var mdAuth = require('../middleware/authenticated')
var api = express.Router();

api.post('/commands', mdAuth.ensureAuth, UserController.commands);

module.exports = api;