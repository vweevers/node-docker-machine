'use strict';

const path = require('path')
    , fs = require('fs')
    , env = process.env
    , cp = require('child_process')

const HOST_NON_EXISTENT = /host does not exist/i
    , ALREADY_RUNNING = /already running/i

class Machine {
  static options(opts) {
    if (typeof opts === 'string') return { name: opts }
    else return opts || {}
  }

  static command(args, done) {
    cp.execFile('docker-machine', [].concat(args), {
      cwd: env.DOCKER_TOOLBOX_INSTALL_PATH || '.',
      encoding: 'utf8'
    }, done)
  }

  constructor(opts) {
    opts = Machine.options(opts)
    this.name = opts.name || env.DOCKER_MACHINE_NAME || 'default'
  }

  static status(name, done) {
    Machine.command(['status', name], (err, stdout) => {
      if (err) done(err)
      else done(null, stdout.trim().toLowerCase())
    })
  }

  static isRunning(name, done) {
    Machine.status(name, (err, status) => {
      done(err, status === 'running')
    })
  }

  static start(name, done) {
    Machine.command(['start', name], (err) => {
      if (HOST_NON_EXISTENT.test(err)) {
        done(new Error(`Docker host "${name}" does not exist`))
      } else if (ALREADY_RUNNING.test(err)) {
        done()
      } else {
        done(err)
      }
    })
  }

  static env(name, opts, done) {
    if (typeof opts === 'function') done = opts, opts = {}

    const args = ['env']

    if (opts.json) args.push('--shell', 'bash')
    else if (opts.shell) args.push('--shell', opts.shell)

    args.push(name)

    Machine.command(args, function (err, stdout) {
      if (err) return done(err)
      if (!opts.json) return done(null, stdout.trim())

      const res = {}

      stdout.split(/\n+/).forEach(line => {
        const m = /^export (.+)="([^"]+)/i.exec(line)
        if (m) res[m[1]] = m[2]
      })

      done(null, res)
    })
  }

  static ssh(name, cmd, done) {
    if (Array.isArray(cmd)) cmd = cmd.join(' ')
    Machine.command(['ssh', name, cmd], done)
  }
}

;['status', 'isRunning', 'start', 'env', 'ssh'].forEach(method => {
  Machine.prototype[method] = function () {
    const args = Array.from(arguments)
    args.unshift(this.name)
    Machine[method].apply(null, args)
  }
})

module.exports = Machine
