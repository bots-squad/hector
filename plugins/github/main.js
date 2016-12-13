let run = (broker) => {

  require(`./eventsObserver.js`).initialize(broker);
  require(`./botObserver.js`).initialize(broker);
  require(`./ciObserver.js`).initialize(broker);
  require(`./statusObserver.js`).initialize(broker);
  require(`./gitObserver.js`).initialize(broker); // something more generic? we can share this with other plugins
  require(`./executorObserver.js`).initialize(broker);

}

module.exports = {
  run: run
};
