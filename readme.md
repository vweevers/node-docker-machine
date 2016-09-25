# docker-machine

**Programmatic API to Docker Machine (0.6.0+).**

[![node](https://img.shields.io/node/v/docker-machine.svg?style=flat-square)](https://www.npmjs.org/package/docker-machine) [![npm status](http://img.shields.io/npm/v/docker-machine.svg?style=flat-square)](https://www.npmjs.org/package/docker-machine) [![Travis build status](https://img.shields.io/travis/vweevers/node-docker-machine.svg?style=flat-square&label=travis)](http://travis-ci.org/vweevers/node-docker-machine) [![AppVeyor build status](https://img.shields.io/appveyor/ci/vweevers/node-docker-machine.svg?style=flat-square&label=appveyor)](https://ci.appveyor.com/project/vweevers/node-docker-machine) [![Dependency status](https://img.shields.io/david/vweevers/node-docker-machine.svg?style=flat-square)](https://david-dm.org/vweevers/node-docker-machine)

## example

`node example.js ls /`

```js
const Machine = require('docker-machine')
const cmd = process.argv.slice(2)

if (!cmd.length) {
  throw new TypeError('Requires a command to run')
}

const machine = new Machine

// Start if not already started
machine.start(function (err) {
  if (err) throw err

  // Execute a command
  machine.ssh(cmd, (err, result) => {
    if (err) throw err
    console.log(result)
  })
})
```

## `new Machine([name || opts])`

Options:

- **name**: defaults to `DOCKER_MACHINE_NAME` or "default"

### `machine.status((err, status) => ..)`

Get lowercased status of machine.

### `machine.isRunning((err, running) => ..)`

True if status is `running`.

### `machine.start(err => ..)`

Start machine, if not already running.

### `machine.env([opts], (err, result) => ..)`

Options:

- **json**: if true, result will be an object
- **shell**: custom shell. Ignored if `json` is true.

### `machine.ssh(command, (err, result) => ..)`

Run a command via SSH.

## install

With [npm](https://npmjs.org) do:

```
npm install docker-machine
```

## license

[MIT](http://opensource.org/licenses/MIT) © Vincent Weevers
