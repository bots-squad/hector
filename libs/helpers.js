const fetch = require('node-fetch');

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

module.exports = {
  postMessage: postMessage
}
