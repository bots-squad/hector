const Observer = require(`../../core_observers/observers`).Observer;

let getPushInformations = (req) => {
  // get the current branch name
  let branch = req.body.ref.split("/").pop();
  if(req.body.deleted == false && branch!=="gh-pages") {
    // === get data from the `PushEvent` payload
    // get the SHA (Secure Hash Algorithm) of the most recent commit on ref after the push
    // see https://developer.github.com/v3/activity/events/types/#events-api-payload-22
    let after = req.body.after;
    let owner = req.body.repository.owner.name;

    // generate the url that will be used to create a status:
    //  "The Status API allows external services to mark commits with a success, failure, error, or pending state"
    // see https://developer.github.com/v3/repos/statuses/#create-a-status
    let statuses_url = `/repos/${owner}/${req.body.repository.name}/statuses/${after}`;

    // get the url of the repository (to clone the repository)
    let repository_url = req.body.repository.clone_url;
    let repository_name = req.body.repository.name;

    return {
      branch, after, owner, statuses_url, repository_url, repository_name
    }

  } else {
    return null
  }
}

let isPullRequestMerged = (req) => {
  let action = req.body.action;
  if(action=="closed") {
    let merged = req.body.pull_request !== undefined ? req.body.pull_request.merged : undefined;
    return merged
  } else {
    return false
  }
}

let initialize = (broker) => {
  let eventsObserver = new Observer(broker)
  /*
    # messages
    broker emits on `ci_event`
  */
  eventsObserver.on('ci_event', req => {
    // capture GitHub event
    let event = req.headers['x-github-event'];
    switch (event) {
      case "push":
        let pushInformations = getPushInformations(req);
        if (pushInformations) {
          eventsObserver.emit("push", pushInformations);
          /*
            # messages
            ciObserver listening on `push`
          */
        }
        break;
      case "pull_request":
        if (isPullRequestMerged(req)) {
          // this will trigger a push event on the "production" branch
          let message = `👍 A pull request was merged! A deployment should start now...`;
          eventsObserver.emit("message", {message: message, from:"eventsObserver"});
          /*
            # messages
            botObserver listening on `message`
            messenger listening on `message` (console)
          */

          eventsObserver.emit("pull_request_merged", message);
          /*
            # messages
            nobody listen on this event ... for the moment
          */

        }
        break;
      default:
        eventsObserver.emit("failure", {message: "🙀 Houston? We have a problem!", from: "eventsObserver"});
        /*
          # messages

          botObserver listening on `failure`
          messenger listening on `failure` (console)
        */
    }
  });
  return eventsObserver;
}

module.exports = {
  initialize: initialize
};
