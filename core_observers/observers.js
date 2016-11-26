const EventEmitter = require('events').EventEmitter;

const broker = new EventEmitter()

class Observer {
  constructor() {
    this.broker = broker;
  }
  on(message, work) { this.broker.on(message, work); }
  emit(message, data) { this.broker.emit(message, data); }
}

module.exports = {
  Observer: Observer
};
