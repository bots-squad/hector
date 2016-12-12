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
    // update PR status
    ciObserver.emit('change_status_to_pending', pushInformations);
    /*
      # messages
      statusObserver listening on `change_status_to_pending`
    */
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
  ciObserver.on('clone_and_checkout_ok', (pushInformations) => {
    if (pushInformations.branch === process.env.PRODUCTION_BRANCH_NAME) {
      // deployment mode, there was a merge on the production branch
      ciObserver.emit('deployment', pushInformations);
      /*
        # messages
        executorObserver listening on `deployment`
        and load + execute (hector-jobs.js) deployment({})
      */
    } else {
      // integration mode
      ciObserver.emit('integration', pushInformations);
      /*
        # messages
        executorObserver listening on `integration`
        and load + execute (hector-jobs.js) integration({})
      */
    }
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
  });

  /*
    # messages
    executorObserver emits on `deployment_ok`
  */
  ciObserver.on('deployment_ok', (pushInformations) => {
    ciObserver.emit("message", {message: "👏 🐼 ✨ 🍾 Deployment is successful!!!", from: "ciObserver"});
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
