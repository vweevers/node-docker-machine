# docker-machine

> **Programmatic API to Docker Machine (0.6.0+).**  
> Wraps the [`docker-machine`](https://docs.docker.com/machine/reference/) CLI.

[![node](https://img.shields.io/node/v/docker-machine.svg)](https://www.npmjs.org/package/docker-machine)
[![npm status](http://img.shields.io/npm/v/docker-machine.svg)](https://www.npmjs.org/package/docker-machine)
[![Travis build status](https://img.shields.io/travis/vweevers/node-docker-machine.svg?label=travis)](http://travis-ci.org/vweevers/node-docker-machine)
[![AppVeyor build status](https://img.shields.io/appveyor/ci/vweevers/node-docker-machine.svg?label=appveyor)](https://ci.appveyor.com/project/vweevers/node-docker-machine)
[![Dependency status](https://img.shields.io/david/vweevers/node-docker-machine.svg)](https://david-dm.org/vweevers/node-docker-machine)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Table of Contents

<details><summary>Click to expand</summary>

- [Example](#example)
- [API](#api)
- [Install](#install)
- [License](#license)

</details>

## Example

`node example.js ls /`

```js
const Machine = require('docker-machine')
const cmd = process.argv.slice(2)
const machine = new Machine()

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

## API

### `new Machine([name || opts])`

Options:

- **name**: defaults to `DOCKER_MACHINE_NAME` or "default"

#### `machine.status((err, status) => ..)`

Get lowercased [status](https://docs.docker.com/machine/reference/status/) of the machine.

#### `machine.isRunning((err, running) => ..)`

True if status is `running`.

#### `machine.start(err => ..)`

Start machine, if not already running.

#### `machine.stop(err => ..)`

Stop machine, if not already stopped.

#### `machine.kill(err => ..)`

Kill machine, if not already stopped.

#### `machine.env([opts], (err, result) => ..)`

Get the environment variables to dictate that Docker should run a command against a particular machine. By default, `env()` returns the output from [`docker-machine env`](https://docs.docker.com/machine/reference/env/) as-is. That is, a script which can be run in a subshell. Options:

- **shell**: custom shell. Ignored if `parse` is true.
- **parse**: if true, `result` will be a plain object:

```js
{
  DOCKER_TLS_VERIFY: '1',
  DOCKER_HOST: 'tcp://<ip>:<port>',
  DOCKER_CERT_PATH: '<home>/.docker/machine/machines/<name>',
  DOCKER_MACHINE_NAME: '<name>'
}
```

#### `machine.ssh(command, (err, result) => ..)`

Run a command via [SSH](https://docs.docker.com/machine/reference/ssh/). The `command` can be a string or an array.

#### `machine.inspect((err, result) => ..)`

Get the output of [`docker-machine inspect`](https://docs.docker.com/machine/reference/inspect/) as a plain object with camelCase properties.

### Static methods

All of the above methods (from `status()` to `inspect()`) are also accessible as static methods, where the first argument is a `name`. For example:

```js
const Machine = require('docker-machine')

Machine.env('default', { json: true }, (err, result) => {
  console.log(result.DOCKER_HOST)
})
```

### `Machine.create(name, driver[, options], (err) => ..)`

Create a machine. Options are driver-specific.

```js
const options = {
  'virtualbox-memory': '1024'
}

Machine.create('test', 'virtualbox', options, (err) => {
  if (err) throw err
})
```

### `Machine.list([opts], (err, machines) => ..)`

Get all machines as an array, via [`docker-machine ls`](https://docs.docker.com/machine/reference/ls/). Each machine is a plain object with camelCase properties.

```js
{
  name: 'agent-1',                  // Machine name
  activeHost: false,                // Is the machine an active host?
  activeSwarm: false,               // Is the machine an active swarm master?
  active: '*',                      // Human-readable combination of the above
  driverName: 'virtualbox',         // Driver name
  state: 'running',                 // Machine state (running, stopped)
  url: 'tcp://192.168.99.101:2376', // Machine URL
  swarm: null,                      // Machine swarm name
  dockerVersion: 'v1.12.0',         // Docker Daemon version
  responseTime: 980,                // Time taken by the host to respond (ms)
  error: null                       // Machine errors
}
```

Options:

- **timeout**: `ls` timeout in seconds (see [docker/machine#1696](https://github.com/docker/machine/issues/1696))
- **inspect**: if true, also include the metadata from `inspect()` for each machine:

```js
{
  name: 'agent-1',                  // Plus all of the above
  driver: {                         // Driver metadata
    cpu: 1,
    memory: 2048,
    hostOnlyCidr: '192.168.99.1/24',
    ..
  },
  hostOptions: {                    // Various host options
    engineOptions: ..
    swarmOptions: ..
  }
}
```

## Install

With [npm](https://npmjs.org) do:

```
npm install docker-machine
```

## License

[MIT](LICENSE) © 2016-present Vincent Weevers
