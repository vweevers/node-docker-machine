'use strict'

const Machine = require('..')

// List all machines
Machine.list((err, res) => {
  if (err) throw err
  console.log(res)
})
