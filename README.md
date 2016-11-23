# hector

CI &amp; CD with JavaScript

> WIP :construction:

## Setup Hector

- `chmod +x hector.js`
- set environment variables
  - `TOKEN_BOT_CI`
  - `GITHUB_API_URL`
  - `CI_HTTP_PORT`
  - `BOT_NOTIFICATION_URL`
- add a webhook in GitHub settings (http://hostname:port/ci)
- add a file named `hector-jobs.js` to the master branch
- add a Dockerfile to the master branch
- run hector: ./hector-deployment.js or node hector-deployment.js

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
