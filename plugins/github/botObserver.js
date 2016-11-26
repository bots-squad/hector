const Observer = require(`../../core_observers/observers`).Observer;
const postMessage = require('../../libs/helpers.js').postMessage;

let initialize = (broker) => {
  let botObserver = new Observer(broker);

  botObserver.on('failure', data => {
    if (process.env.BOT_NOTIFICATION_URL) {
      postMessage(process.env.BOT_NOTIFICATION_URL, `failure from ${data.from}: ${data.message}`);
    }
  });

  botObserver.on('message', data => {
    if (process.env.BOT_NOTIFICATION_URL) {
      postMessage(process.env.BOT_NOTIFICATION_URL, `message from ${data.from}: ${data.message}`);
    }
  });

  botObserver.on('error', data => {
    if (process.env.BOT_NOTIFICATION_URL) {
      postMessage(process.env.BOT_NOTIFICATION_URL, `error from ${data.from}: ${data.message}`);
    }
  });

  return botObserver;
}

module.exports = {
  initialize: initialize
};
