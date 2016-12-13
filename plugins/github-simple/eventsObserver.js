const Observer = require(`../../core_observers/observers`).Observer;

let initialize = (broker) => {
  let eventsObserver = new Observer(broker)

  eventsObserver.emit(
    "message",
    {
      message: `GitHub simple plugin is loaded`,
      from: "eventsObserver"
    }
  );

  /*
    # messages
    broker emits on `ci_event`
  */
  eventsObserver.on('ci_event', req => {
    // capture GitHub event
    let event = req.headers['x-github-event'];
    switch (event) {
      case "push":
        let branch = req.body.ref.split("/").pop();

        if (branch === process.env.PRODUCTION_BRANCH_NAME) {

          if(req.body.commits.length === 1) { // Someone is pushing one or more commits directly to PRODUCTION_BRANCH_NAME (eg: master 😡)
            eventsObserver.emit(
              "error",
              {
                message: `😡 Someone is pushing one or more commits directly to ${process.env.PRODUCTION_BRANCH_NAME}`,
                from: "eventsObserver"
              }
            );
            eventsObserver.emit(
              "error",
              {
                message: `😡 ${process.env.PRODUCTION_BRANCH_NAME} won't be deployed`,
                from: "eventsObserver"
              }
            );
            /*
              # messages
              messenger listening on `error` (console)
            */

          } else { // Someone is merging a pull request to PRODUCTION_BRANCH_NAME (eg: master 😀)
            eventsObserver.emit(
              "message",
              {
                message: `😀 Someone is merging a pull request to ${process.env.PRODUCTION_BRANCH_NAME}`,
                from: "eventsObserver"
              }
            );
            /*
              # messages
              messenger listening on `message` (console)
            */
          }

        } else { // everything is ok 😀 this is a push on a branch

          eventsObserver.emit(
            "message",
            {
              message: `😀 Someone is pushing to ${branch}`,
              from: "eventsObserver"
            }
          );
          /*
            # messages
            messenger listening on `message` (console)
          */

          // do something ...
        }


        break;
      case "pull_request":

        let action = req.body.action;
        console.log("pull request action: ", action)

        if(action=="closed") {
          let merged = req.body.pull_request !== undefined ? req.body.pull_request.merged : undefined;

          if (merged) {

            let feature_branch = req.body.pull_request.head.ref
            let branch = req.body.pull_request.base.ref
            let owner = req.body.repository.owner.login;

            let message = `👍 A pull request was merged ${feature_branch} on ${branch}! A deployment should start now...`;
            eventsObserver.emit("message", {message: message, from:"eventsObserver"});
            /*
              # messages
              messenger listening on `message` (console)
            */
            // do something ...
          }
        }

        break;
      default:
        eventsObserver.emit("failure", {message: "🙀 Houston? We have a problem!", from: "eventsObserver"});
        /*
          # messages
          messenger listening on `failure` (console)
        */
    }
  });
  return eventsObserver;
}

module.exports = {
  initialize: initialize
};
