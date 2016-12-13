let run = (broker) => {
  require(`./eventsObserver.js`).initialize(broker);
}

module.exports = {
  run: run
};
