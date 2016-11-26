const Observer = require(`../../core_observers/observers`).Observer;
const GitHubClient = require('./octocat.js').GitHubClient;

let githubCli = new GitHubClient({
  baseUri:  process.env.GITHUB_API_URL,
  token:    process.env.TOKEN_BOT_CI
});

let hostname = require("os").hostname();

let initialize = (broker) => {
  let statusObserver = new Observer(broker)

  // before, set the status of the commit/pr to `pending`
  // ... and then "go to work!"
  statusObserver.on('change_status_to_pending', (pushInformations) => {
    githubCli.postData({path: pushInformations.statuses_url, data:{
        state: "pending"
      , description: "Hi, I'm Hector :|"
      , context: "[Hector] CI Server"
      , target_url: `http://${hostname}:${process.env.CI_HTTP_PORT}`
    }})
    .then(res => {
      statusObserver.emit('status_is_pending', pushInformations);
    })
    .catch(err => {
      statusObserver.emit("failure", {message: "🙀 Houston? We have a problem! [change_status_to_pending]", from: "statusObserver"});
    })

  });

  statusObserver.on('change_status_to_failure', (pushInformations) => {
    // update status
    githubCli.postData({path: pushInformations.statuses_url, data:{
        state: "failure"
      , description: "Hi, I'm Hector :("
      , context: "[Hector] CI Server"
      , target_url: `http://${hostname}:${process.env.CI_HTTP_PORT}`
    }});
  });

  statusObserver.on('change_status_to_success', (pushInformations) => {
    // update status
    githubCli.postData({path: pushInformations.statuses_url, data:{
        state: "success"
      , description: "Hi, I'm Hector :)"
      , context: "[Hector] CI Server"
      , target_url: `http://${hostname}:${process.env.CI_HTTP_PORT}/${pushInformations.random_path}-stdout.log.txt`
    }});
  });

  statusObserver.on('change_status_to_error', (pushInformations) => {
    // update status
    githubCli.postData({path: pushInformations.statuses_url, data:{
        state: "error"
      , description: "Hi, I'm Hector :("
      , context: "[Hector] CI Server"
      , target_url: `http://${hostname}:${process.env.CI_HTTP_PORT}/${pushInformations.random_path}-stdout.log.txt`
    }});
  });


  return statusObserver;
}

module.exports = {
  initialize: initialize
};
