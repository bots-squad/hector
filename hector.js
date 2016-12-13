#!/usr/bin/env node
const express = require('express');
const bodyParser = require('body-parser');

const Broker = require(`./core_observers/observers`).Broker;
const Observer = require(`./core_observers/observers`).Observer;

/*
Express application
*/
let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('clones'));


let broker = new Broker();
require(`./core_observers/messengerObserver`).initialize(broker);
// load plugin
require(`${process.env.HECTOR_PLUGIN_PATH}/main.js`).run(broker);

/*
this route is called from the DVCS (eg GitHub)
(see webhooks in your DVCS settings)
*/
app.post('/ci', (req, res) => {
  broker.emit('ci_event', req)
  /*
    # messages
    eventsObserver listening on `ci_event`
  */
  res.status(201).end();
});

app.listen(process.env.CI_HTTP_PORT)

let message = `🚀 Hector CI Server is started - listening on ${process.env.CI_HTTP_PORT}`;
broker.emit('message', {message: message, from: "Hector"});
