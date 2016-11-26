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
// plugin observers
require(`${process.env.HECTOR_PLUGIN_PATH}/eventsObserver.js`).initialize(broker);
require(`${process.env.HECTOR_PLUGIN_PATH}/botObserver.js`).initialize(broker);
require(`${process.env.HECTOR_PLUGIN_PATH}/ciObserver.js`).initialize(broker);
require(`${process.env.HECTOR_PLUGIN_PATH}/statusObserver.js`).initialize(broker);
require(`${process.env.HECTOR_PLUGIN_PATH}/gitObserver.js`).initialize(broker); // something more generic? we can share this with other plugins
require(`${process.env.HECTOR_PLUGIN_PATH}/executorObserver.js`).initialize(broker);


/*
this route is called from the DVCS (eg GitHub)
(see webhooks in your DVCS settings)
*/
app.post('/ci', (req, res) => {
  broker.emit('ci_event', req)
  res.status(201).end();
});

app.listen(process.env.CI_HTTP_PORT)

let message = `🚀 Hector CI Server is started - listening on ${process.env.CI_HTTP_PORT}`;
broker.emit('message', {message: message, from: "Hector"});
