/*
## "Inspiration"

- https://developer.github.com/guides/building-a-ci-server/

## TODO
- `chmod +x hector.js`
- set environment variables
  - TOKEN_BOT_CI
  - GITHUB_API_URL
  - CI_HTTP_PORT
  - BOT_NOTIFICATION_URL
- add a webhook in GitHub settings (http://hostname:port/ci)
- add a file named `hector-jobs.js` to the master branch (see README.md)
- add a Dockerfile to the master branch (see README.md)
- run hector: ./hector-deployment.js or node hector-deployment.js
*/
const Observer = require(`../../core_observers/observers`).Observer;

let initialize = (broker) => {
  let ciObserver = new Observer(broker)

  /*
    # messages
    eventsObserver emits on `ci_event`
  */
  ciObserver.on('push', (pushInformations) => {
    // TODO: you have to protect master -> no direct push on master
    // update PR status
    ciObserver.emit('change_status_to_pending', pushInformations);
    /*
      # messages
      statusObserver listening on `change_status_to_pending`
    */
  });

  /*
    # messages
    eventsObserver emits on `ci_event`
  */
  ciObserver.on('pull_request_merged', (informations) => {
    // deployment only if merge on PRODUCTION_BRANCH_NAME
    if (informations.branch === process.env.PRODUCTION_BRANCH_NAME) {

      // this will trigger a push event on the "production" branch
      let message = `🤗 A pull request was merged on ${informations.branch} from ${informations.feature_branch}! A deployment is starting...`;
      ciObserver.emit("message", {message: message, from:"ciObserver"});

      informations.task = "deployment" // we are going to clone and check out for a deployment
      ciObserver.emit('clone_and_checkout', informations);
      /*
        # messages
        gitObserver listening on `clone_and_checkout_for_deployment`
      */
    }
  });

  /*
    # messages
    statusObserver emits on `status_is_pending`
  */
  ciObserver.on('status_is_pending', (pushInformations) => {
    // status is setted to pending, then start building, testing, or what ever you want...
    // Actions:
    // - create a temporay directory to "mount" the repository
    // - clone the repository
    // - run tests
    pushInformations.task = "integration" // we are going to clone and check out for an integration (tests)
    ciObserver.emit('clone_and_checkout', pushInformations);
    /*
      # messages
      gitObserver listening on `clone_and_checkout`
    */
  })

  // 🍾 🍻 ✨ ☀️ repository "mounted"
  /*
    # messages
    gitObserver emits on `clone_and_checkout_ok`
  */
  ciObserver.on('clone_and_checkout_ok', (informations) => {
    // when the repository is cloned, then
    // - we run the integration task (it's only a push)
    // - we run deployment task (PR has been merged)

    // possible values for informations.task
    // - integration
    // - deployment
    ciObserver.emit(informations.task, informations);

    /*
      # messages
      executorObserver listening on `deployment`
      and load + execute (hector-jobs.js) deployment({})

      executorObserver listening on `integration`
      and load + execute (hector-jobs.js) integration({})
    */

  });

  // Ouch 🔥 💥 ⚡️ repository not "mounted"
  /*
    # messages
    gitObserver emits on `clone_and_checkout_ko`
  */
  ciObserver.on('clone_and_checkout_ko', (pushInformations) => {
    // update PR status
    ciObserver.emit('change_status_to_failure', pushInformations);
    /*
      # messages
      statusObserver listening on `change_status_to_failure`
    */
    ciObserver.emit("failure", {message: "🙀 Houston? We have a problem! [clone_and_checkout_ko]", from: "ciObserver"});
  });

  /*
    # messages
    executorObserver emits on `integration_ok`
  */
  ciObserver.on('integration_ok', (pushInformations) => {
    // update PR status
    ciObserver.emit('change_status_to_success', pushInformations);
    /*
      # messages
      statusObserver listening on `change_status_to_success`
    */
    ciObserver.emit("message", {message: "😀 integration 👍 [integration_ok]", from: "ciObserver"});

    //TODO: here -> we can start a deployment preview
    // how to deal with the http port ???
  });

  /*
    # messages
    executorObserver emits on `deployment_ok`
  */
  ciObserver.on('deployment_ok', (pushInformations) => {
    ciObserver.emit("message", {message: "👏 🐼 ✨ 🍾 Deployment is successful!!!", from: "ciObserver"});

    // add somewhere else, because, we don't make only web sites
    // perhaps, pass an observer (messenger) to the executor ...
    ciObserver.emit("message", {message: process.env.URL_WEB_SITE, from: "ciObserver"});

  });

  /*
    # messages
    executorObserver emits on `integration_ko`
  */
  ciObserver.on('integration_ko', (pushInformations) => {
    // update PR status
    ciObserver.emit('change_status_to_error', pushInformations);
    /*
      # messages
      statusObserver listening on `change_status_to_error`
    */
    ciObserver.emit("error", {message: "😡 integration 👎 [integration_ko]", from: "ciObserver"});
  });

  /*
    # messages
    executorObserver emits on `deployment_ko`
  */
  ciObserver.on('deployment_ko', (pushInformations) => {
    // TODO
  });

  return ciObserver;
}

module.exports = {
  initialize: initialize
};
