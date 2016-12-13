# GitHub simple plugin

> this plugin is designed to work with the GitHub Flow

## How to setup and run it

### go.js

Create a `go.js` file at the root of the repository:

```
#!/usr/bin/env node
require('shelljs/global');

process.env["CI_HTTP_PORT"] = 8888;

process.env["PRODUCTION_BRANCH_NAME"] = "master";

process.env["HECTOR_PLUGIN_PATH"] = "./plugins/github-simple"

exec(`./hector.js`)
```

Change attributes of `go.js`:

```
chmod +x go.js
```

Run hector:

```
./go.js
```
