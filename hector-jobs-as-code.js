#!/usr/bin/env node
require('shelljs/global');
const fs = require("fs");
const uuid = require('uuid');
const fetch = require('node-fetch');
const express = require('express');
const bodyParser = require('body-parser');
const GitHubClient = require('./libs/octocat.js').GitHubClient;

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
- add a webhook in GitHub settings
- add a file named `hector-jobs.js` to the master branch:

```javascript
function integration(options) {
  console.log(__dirname);
  let cmds = [
      `cd ${__dirname};`
    , `npm --cache-min 9999999 install; `
    , `npm test`
  ];
  return cmds.join('');
}

module.exports = {
  integration: integration
}
```
- run hector: ./hector.js or node hector.js
*/


let githubCli = new GitHubClient({
  baseUri:  process.env.GITHUB_API_URL,
  token:    process.env.TOKEN_BOT_CI
});

let postMessage = (url, message) => {
  return fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      message: message
    }),
    headers: {
      "Content-Type": "application/json"
    }
  })
}

/*
Express application
*/
let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('clones'));

let hostname = require("os").hostname();

/*
this route is called from the DVCS (GitHub)
(see webhook in GitHub settings)
*/
app.post('/ci', (req, res) => {
  // capture GitHub event
  let event = req.headers['x-github-event'];

  switch (event) {
    case "push":
      if(req.body.deleted == false) {
        // === get data from the `PushEvent` payload
        // get the SHA (Secure Hash Algorithm) of the most recent commit on ref after the push
        // see https://developer.github.com/v3/activity/events/types/#events-api-payload-22
        let after = req.body.after;
        let owner = req.body.repository.owner.name;

        // generate the url that will be used to create a status:
        //  "The Status API allows external services to mark commits with a success, failure, error, or pending state"
        // see https://developer.github.com/v3/repos/statuses/#create-a-status
        let statuses_url = `/repos/${owner}/${req.body.repository.name}/statuses/${after}`;

        // get the current branch name
        let branch = req.body.ref.split("/").pop();

        // get the url of the repository (to clone the repository)
        let repository_url = req.body.repository.clone_url;
        let repository_name = req.body.repository.name;

        // ⚠️⚠️⚠️ now, here you could notify a bot, create issue ... What ever
        if (process.env.BOT_NOTIFICATION_URL) {
          postMessage(process.env.BOT_NOTIFICATION_URL, "Checking in progress 🚧 ... ");
        }

        // before, set the status of the commit/pr to `pending`
        // ... and then "go to work!"
        githubCli.postData({path:statuses_url, data:{
            state: "pending"
          , description: "Hi, I'm Hector :)"
          , context: "[Hector] CI Server"
          , target_url: `http://${hostname}:${process.env.CI_HTTP_PORT}`
        }})
        .then(res => { // status is setted to pending, then start building, testing, or what you want...

          // Actions:
          // - create a temporay directory to "mount" the repository
          // - clone the repository
          // - run tests

          let random_path = uuid.v4();
          let tmp_directory = `clones/${random_path}`;

          // prepare a list of commands to execute
          let cmd = [
              `mkdir ${tmp_directory}; `
            , `cd ${tmp_directory}; `
            , `git clone ${repository_url}; `
            , `cd ${repository_name}; `
            , `git checkout ${branch}; `
          ].join('');

          // === Execute the commands list ===
          // see http://bencane.com/2014/09/02/understanding-exit-codes-and-how-to-use-them-in-bash-scripts/
          // On Unix and Linux systems, programs can pass a value to their parent process while terminating.
          // This value is referred to as an exit code or exit status.
          // On POSIX systems the standard convention is for the program
          // - to pass 0 for successful executions
          // - and 1 or higher for failed executions.
          exec(cmd, (code, stdout, stderr) => {
            switch (code) {
              case 0: // 🍾 🍻 ✨ ☀️ repository "mounted"

                // TODO: test the code execution (try catch)
                exec(require(`./${tmp_directory}/${repository_name}/hector-jobs.js`).integration({}), (code, stdout, stderr) => {

                  switch (code) {
                    case 0:
                      let messageOK = ('😀 integration 👍');
                      console.info(messageOK);

                      fs.writeFile(`${tmp_directory}-stdout.log.txt`, stdout, (err) => {
                         if (err) { console.error(err); }
                      });

                      // update status
                      githubCli.postData({path:statuses_url, data:{
                          state: "success"
                        , description: "Hi, I'm Hector :)"
                        , context: "[Hector] CI Server"
                        , target_url: `http://${hostname}:${process.env.CI_HTTP_PORT}/${random_path}-stdout.log.txt`
                      }});

                      // ⚠️⚠️⚠️ now, here you could notify a bot, create issue ... What ever
                      if (process.env.BOT_NOTIFICATION_URL) {
                        postMessage(process.env.BOT_NOTIFICATION_URL, messageOK);
                      }

                      break;
                    default:
                      let messageKO = `😡 integration 👎`;
                      console.error(messageKO);

                      fs.writeFile(`${tmp_directory}-stderr.log`, stderr, (err) => {
                        if (err) { console.error(err); }
                      });

                      fs.writeFile(`${tmp_directory}-stdout.log.txt`, stdout, (err) => {
                         if (err) { console.error(err); }
                      });

                      // update status
                      githubCli.postData({path:statuses_url, data:{
                          state: "error"
                        , description: "Hi, I'm Hector :)"
                        , context: "[Hector] CI Server"
                        , target_url: `http://${hostname}:${process.env.CI_HTTP_PORT}/${random_path}-stdout.log.txt`
                      }});

                      // ⚠️⚠️⚠️ now, here you could notify a bot, create issue ... What ever
                      if (process.env.BOT_NOTIFICATION_URL) {
                        postMessage(process.env.BOT_NOTIFICATION_URL, messageKO);
                      }

                  } // end of switch

                  // remove directory
                  exec(`rm -rf ${tmp_directory}`)

                }) // end of exec

                break;
              default: // Ouch 🔥 💥 ⚡️ repository not "mounted"

              // update status
              githubCli.postData({path:statuses_url, data:{
                  state: "failure"
                , description: "Hi, I'm Hector :)"
                , context: "[Hector] CI Server"
                , target_url: `http://${hostname}:${process.env.CI_HTTP_PORT}`
              }});

              // ⚠️⚠️⚠️ now, here you could notify a bot, create issue ... What ever
              if (process.env.BOT_NOTIFICATION_URL) {
                postMessage(process.env.BOT_NOTIFICATION_URL, "🙀 Houston? We have a problem!");
              }

            } // end of switch

          }); // end of exec

        }) // and of then
        .catch(error => {
          console.log(error)
        })
      } // end if
      break;

    case "pull_request": // my event is about pull request
      let action = req.body.action;

      if(action=="closed") {
        let merged = req.body.pull_request !== undefined ? req.body.pull_request.merged : undefined;
        if(merged) {
          let message = `👍 A pull request was merged! A deployment should start now...`;
          console.log(message);

          // ⚠️⚠️⚠️ now, here you could notify a bot, create issue ... What ever
          if (process.env.BOT_NOTIFICATION_URL) {
            postMessage(process.env.BOT_NOTIFICATION_URL, message);
          }

        }
      }
      break;
    default:
      console.error("🙀 Houston? We have a problem!");
  }


  res.status(201).end();
});

app.listen(process.env.CI_HTTP_PORT)

let message = `🚀 Hector CI Server is started - listening on ${process.env.CI_HTTP_PORT}`;
console.log(message)

// ⚠️⚠️⚠️ now, here you could notify a bot, create issue ... What ever
if (process.env.BOT_NOTIFICATION_URL) {
  postMessage(process.env.BOT_NOTIFICATION_URL, message)
}
