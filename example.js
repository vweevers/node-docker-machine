'use strict';

const Machine = require('./')
const cmd = process.argv.slice(2)

if (!cmd.length) {
  throw new TypeError('Requires an SSH command')
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
