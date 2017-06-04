const Observer = require(`../../core_observers/observers`).Observer;

const crypto = require('crypto');
const bufferEq = require('buffer-equal-constant-time');

// "security" helpers, see: http://blog.gisonrg.me/2016/create-github-webhook-handler/
let signData = (secret, data) => {
	return 'sha1=' + crypto.createHmac('sha1', secret).update(data).digest('hex');
}

let checkSignature = (secret, data, signature) => {
	return bufferEq(new Buffer(signature), new Buffer(signData(secret, data)));
}


let getPushInformations = (req) => {
  // get the current branch name
  let branch = req.body.ref.split("/").pop();
  if((req.body.deleted === false || req.body.deleted === undefined) && branch!=="gh-pages") {
    // === get data from the `PushEvent` payload
    // get the SHA (Secure Hash Algorithm) of the most recent commit on ref after the push
    // see https://developer.github.com/v3/activity/events/types/#events-api-payload-22
    let after = req.body.after;
    let owner = req.body.repository.owner.name === undefined ? req.body.repository.owner.login : req.body.repository.owner.name;

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

let getInformationsWhenPullRequest = (req) => {

  let feature_branch = req.body.pull_request.head.ref
  let branch = req.body.pull_request.base.ref
  let owner = req.body.repository.owner.login;

  let repository_url = req.body.repository.clone_url;
  let repository_name = req.body.repository.name;

  let return_value = {
    feature_branch, branch, owner, repository_url, repository_name
  }

  return return_value
}


let isPullRequestMerged = (req) => {
  let action = req.body.action;
  console.log("======= pull request action =======")
  console.log(action)
  console.log("===================================")

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

    let getEvent = () => {
      let signature = req.headers['x-hub-signature'];
      return checkSignature(
        process.env.CI_SECRET, // setup the secret pass phrase in the hook settings
        JSON.stringify(req.body),
        signature
      ) ? req.headers['x-github-event'] // capture GitHub event
        : "bad_ci_secret"
    }

    // capture GitHub event
    //let event = req.headers['x-github-event'];

    switch (getEvent()) {
      case "push":

        let pushInformations = getPushInformations(req);
        if (pushInformations) {

          if (pushInformations.branch === process.env.PRODUCTION_BRANCH_NAME) {
            // https://community.hpe.com/t5/Technical-Support-Services/DevOps-Deep-Dive-Detecting-a-direct-push-to-master-in-GitHub/ba-p/6795954#.WE-JpqIrIpK
            // push on PRODUCTION_BRANCH_NAME
            // because:
            // - merge of pull request
            // - or somebody has directly push on PRODUCTION_BRANCH_NAME (eg: master 😡)

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

            } else { // Someone is merging a pull request to PRODUCTION_BRANCH_NAME (eg: master 😀)
              eventsObserver.emit(
                "message",
                {
                  message: `😀 Someone is merging a pull request to ${process.env.PRODUCTION_BRANCH_NAME}`,
                  from: "eventsObserver"
                }
              );
            }

          } else { // everything is ok 😀

            eventsObserver.emit(
              "message",
              {
                message: `😀 Someone is pushing to ${pushInformations.branch}`,
                from: "eventsObserver"
              }
            );

            eventsObserver.emit("push", pushInformations);
            /*
              # messages
              ciObserver listening on `push`
            */
          }
        }
        break;
      case "pull_request":
        if (isPullRequestMerged(req)) {
          let message = `👍 A pull request was merged! A deployment should start now...`;
          eventsObserver.emit("message", {message: message, from:"eventsObserver"});
          /*
            # messages
            botObserver listening on `message`
            messenger listening on `message` (console)
          */
          let informations = getInformationsWhenPullRequest(req)
          eventsObserver.emit("pull_request_merged", informations);
          /*
            # messages
            ciObserver listening on `pull_request_merged`
          */

        }
        break;
      case "bad_ci_secret":
        let after = req.body.after;
        let owner = req.body.repository.owner.name;
        let statuses_url = `/repos/${owner}/${req.body.repository.name}/statuses/${after}`;

        eventsObserver.emit("failure", {message: "😡 Authentication failed!", from: "eventsObserver"});
        eventsObserver.emit("change_status_to_failure",{
          statuses_url: statuses_url,
          description: "Authentication failed!"
        });

        break;
      default:
        eventsObserver.emit("event", {message: req.headers['x-github-event'], from: "eventsObserver"});
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
