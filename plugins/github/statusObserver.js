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

  /*
    # messages
    ciObserver emits on `change_status_to_pending`
  */
  statusObserver.on('change_status_to_pending', (pushInformations) => {
    githubCli.postData({path: pushInformations.statuses_url, data:{
        state: "pending"
      , description: pushInformations.description ? pushInformations.description : "Hi, I'm Hector :|"
      , context: pushInformations.context ? pushInformations.context : "[Hector] CI Server"
      , target_url: `http://${hostname}:${process.env.CI_HTTP_PORT}`
    }})
    .then(res => {
      statusObserver.emit('status_is_pending', pushInformations);
      /*
        # messages
        ciObserver listening on `status_is_pending`
      */
    })
    .catch(err => {
      statusObserver.emit("failure", {message: "🙀 Houston? We have a problem! [change_status_to_pending]", from: "statusObserver"});
    })

  });

  /*
    # messages
    ciObserver emits on `change_status_to_failure`
  */
  statusObserver.on('change_status_to_failure', (pushInformations) => {
    // update status
    let data = {
        state: "failure"
      , description: pushInformations.description ? pushInformations.description : "Hi, I'm Hector :("
      , context: pushInformations.context ? pushInformations.context : "[Hector] CI Server"
      , target_url: `http://${hostname}:${process.env.CI_HTTP_PORT}`
    }
    githubCli.postData({path: pushInformations.statuses_url, data: data});
  });

  /*
    # messages
    ciObserver emits on `change_status_to_success`
  */
  statusObserver.on('change_status_to_success', (pushInformations) => {
    // update status
    githubCli.postData({path: pushInformations.statuses_url, data:{
        state: "success"
      , description: pushInformations.description ? pushInformations.description : "Hi, I'm Hector :)"
      , context: pushInformations.context ? pushInformations.context : "[Hector] CI Server"
      , target_url: `http://${hostname}:${process.env.CI_HTTP_PORT}/${pushInformations.random_path}-stdout.log.txt`
    }});
  });

  /*
    # messages
    ciObserver emits on `change_status_to_error`
  */
  statusObserver.on('change_status_to_error', (pushInformations) => {
    // update status
    githubCli.postData({path: pushInformations.statuses_url, data:{
        state: "error"
        , description: pushInformations.description ? pushInformations.description : "Hi, I'm Hector :("
        , context: pushInformations.context ? pushInformations.context : "[Hector] CI Server"
      , target_url: `http://${hostname}:${process.env.CI_HTTP_PORT}/${pushInformations.random_path}-stdout.log.txt`
    }});
  });


  return statusObserver;
}

module.exports = {
  initialize: initialize
};
