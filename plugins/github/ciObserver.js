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

  ciObserver.on('push', (pushInformations) => {
    // update PR status
    ciObserver.emit('change_status_to_pending', pushInformations);
  });

  ciObserver.on('status_is_pending', (pushInformations) => {
    // status is setted to pending, then start building, testing, or what ever you want...
    // Actions:
    // - create a temporay directory to "mount" the repository
    // - clone the repository
    // - run tests
    ciObserver.emit('clone_and_checkout', pushInformations);
  })

  // 🍾 🍻 ✨ ☀️ repository "mounted"
  ciObserver.on('clone_and_checkout_ok', (pushInformations) => {
    if (pushInformations.branch === process.env.PRODUCTION_BRANCH_NAME) {
      // deployment mode, there was a merge on the production branch
      ciObserver.emit('deployment', pushInformations);
    } else {
      // integration mode
      ciObserver.emit('integration', pushInformations);
    }
  });

  // Ouch 🔥 💥 ⚡️ repository not "mounted"
  ciObserver.on('clone_and_checkout_ko', (pushInformations) => {
    // update PR status
    ciObserver.emit('change_status_to_failure', pushInformations);
    ciObserver.emit("failure", {message: "🙀 Houston? We have a problem! [clone_and_checkout_ko]", from: "ciObserver"});
  });


  ciObserver.on('integration_ok', (pushInformations) => {
    // update PR status
    ciObserver.emit('change_status_to_success', pushInformations);
    ciObserver.emit("message", {message: "😀 integration 👍 [integration_ok]", from: "ciObserver"});
  });

  ciObserver.on('deployment_ok', (pushInformations) => {
    ciObserver.emit("message", {message: "👏 🐼 ✨ 🍾 Deployment is successful!!!", from: "ciObserver"});
  });

  ciObserver.on('integration_ko', (pushInformations) => {
    // update PR status
    ciObserver.emit('change_status_to_error', pushInformations);
    ciObserver.emit("error", {message: "😡 integration 👎 [integration_ko]", from: "ciObserver"});
  });

  ciObserver.on('deployment_ko', (pushInformations) => {
    // TODO
  });

  return ciObserver;
}

module.exports = {
  initialize: initialize
};
