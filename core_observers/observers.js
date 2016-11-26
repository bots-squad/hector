const EventEmitter = require('events').EventEmitter;

class Broker extends EventEmitter { }

class Observer {
  constructor(broker) {
    this.broker = broker;
  }
  on(message, work) { this.broker.on(message, work); }
  emit(message, data) { this.broker.emit(message, data); }
}

module.exports = {
    Observer: Observer
  , Broker: Broker
};
