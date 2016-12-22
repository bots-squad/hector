# hector

CI &amp; CD with JavaScript

> WIP :construction:
> Next: create plugins

## Setup Hector (for use with :octocat: plugin)

- `chmod +x hector.js`
- set environment variables
  - set the environment variable `HECTOR_PLUGIN_PATH` eg: `process.env["HECTOR_PLUGIN_PATH"] = "./plugins/github"`
  - add a webhook in GitHub settings (http://hostname:port/ci)
    - you have to set a pass phrase (secret phrase)
    - and then setup `CI_SECRET`
  - `TOKEN_BOT_CI`
    - this is a **personal access token**
    - you can use a token from your personal settings
    - or a token from a "bot/virtual" user (the bot/virtual user has to exist in the team of the project)
  - `GITHUB_API_URL` (if you use :octocat: .com or Enterprise)
    - if you use www.github.com, use this value: https://api.github.com
    - eg: if you use GitHub Enterprise http://your_domain_name/api/v3
  - `CI_HTTP_PORT`
  - `BOT_NOTIFICATION_URL` (only if you use bot with a chat)
  - `URL_WEB_SITE` (url of the deployed web site, only if you need it)
- add a file named `hector-jobs.js` to the master branch (tasks to run when something is pushed)
- if you use docker for the deployment: add a Dockerfile to the master branch

## Run Hector

- run hector: `./hector.js` or `node hector.js`

## Job sample

**hector-jobs.js** at the root of master branch
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

function deployment(options) {
  console.log("🐳 🐳 🐳 Docker deployment!")

  let cmds = [
      `cd ${__dirname};`
    , `docker stop demo-web-container;`
    , `docker rm demo-web-container;`
    , `docker build -t demo-web .; `
    , `docker run -p 9999:9999 --name demo-web-container -d -t -i demo-web`
  ];
  return cmds.join('');
}

module.exports = {
  integration: integration,
  deployment: deployment
}
```

## package.json sample

```
{
  "name": "stools",
  "version": "1.0.0",
  "description": "",
  "main": "src/index.js",
  "dependencies": {
    "body-parser": "^1.15.2",
    "express": "^4.14.0"
  },
  "scripts": {
    "test": "./node_modules/.bin/mocha tests/**",
    "start": "./app.js"
  },
  "repository": {
    "type": "git"
  },
  "author": "@k33g",
  "license": "MIT",
  "devDependencies": {
    "chai": "^3.5.0",
    "mocha": "^2.5.3"
  }
}
```


## Dockerfile sample

```
FROM mhart/alpine-node:7

MAINTAINER @k33g_org

ENV EXPRESS_PORT 9999

RUN mkdir -p /home/webapp
ADD package.json /home/webapp/package.json

WORKDIR home/webapp
RUN npm install

ADD . /home/webapp

EXPOSE 9999

CMD node app.js
```
