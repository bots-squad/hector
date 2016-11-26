const Observer = require(`./observers`).Observer;
const Broker = require(`./observers`).Broker;

class ExecutorObserver extends Observer {
  constructor(broker) {
    super(broker)
  }
}
let broker = new Broker()
let november = new ExecutorObserver(broker)
let december = new ExecutorObserver(broker)

december.on("yo", (data)=>{
  console.log("coucou", data)
})

november.emit("yo", {message:"tada"})
