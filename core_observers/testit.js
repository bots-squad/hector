const Observer = require(`./observers`).Observer;

class ExecutorObserver extends Observer {
  constructor() {
    super()
  }
}

let november = new ExecutorObserver()
let december = new ExecutorObserver()

december.on("yo", (data)=>{
  console.log("coucou", data)
})

november.emit("yo", {message:"tada"})
