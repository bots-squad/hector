#!/usr/bin/env node
require('shelljs/global');
const fs = require("fs");
const uuid = require('uuid');
const fetch = require('node-fetch');
const express = require('express');
const bodyParser = require('body-parser');

const postMessage = require('./libs/helpers.js').postMessage;


const whenEvent = require('./plugins/github/app.js').whenEvent;


/*
Express application
*/
let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('clones'));

/*
this route is called from the DVCS (GitHub)
(see webhook in GitHub settings)
*/
app.post('/ci', (req, res) => {

  whenEvent(req)

  res.status(201).end();
});

app.listen(process.env.CI_HTTP_PORT)

let message = `🚀 Hector CI Server is started - listening on ${process.env.CI_HTTP_PORT}`;
console.log(message)

// ⚠️⚠️⚠️ now, here you could notify a bot, create issue ... What ever
if (process.env.BOT_NOTIFICATION_URL) {
  postMessage(process.env.BOT_NOTIFICATION_URL, message)
}
