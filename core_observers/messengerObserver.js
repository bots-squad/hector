const Observer = require(`./observers`).Observer;

let initialize = (broker) => {
  let messenger = new Observer(broker)

  messenger.on('failure', data => {
    console.error(`failure from ${data.from}: ${data.message}`);
  });

  messenger.on('message', data => {
    console.log(`message from ${data.from}: ${data.message}`);
  });

  messenger.on('error', data => {
    console.log(`error from ${data.from}: ${data.message}`);
  });

  return messenger;
}

module.exports = {
  initialize: initialize
};
