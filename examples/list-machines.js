'use strict';

const Machine = require('..')

// List all machines with additional metadata
Machine.list({ inspect: true }, (err, machines) => {
  if (err) throw err
  console.log(machines)
})
