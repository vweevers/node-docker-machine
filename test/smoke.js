'use strict'

const test = require('tape'),
  series = require('run-series'),
  Machine = require('../')

console.error('Warning: running these smoke tests will alter the state of your machines.')
console.error('Starting in 5 seconds..')

setTimeout(function () {
  test('start, status and stop', { timeout: 5 * 60 * 1e3 }, function (t) {
    t.plan(3)

    const m = new Machine('default')

    series([
      (next) => m.start(next),
      (next) => m.status((err, status) => {
        if (err) return next(err)
        t.is(status, 'running', 'status is running')
        next()
      }),

      (next) => m.start(next),
      (next) => m.stop(next),

      (next) => m.status((err, status) => {
        if (err) return next(err)
        t.is(status, 'stopped', 'status is stopped')
        next()
      }),

      (next) => m.stop(next)
    ], (err) => {
      t.ifError(err, 'no error')
    })
  })
}, 5e3)
