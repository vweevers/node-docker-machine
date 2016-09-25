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

  status(done) {
    this.command(['status', this.name], (err, stdout) => {
      if (err) done(err)
      else done(null, stdout.trim().toLowerCase())
    })
  }

  isRunning(done) {
    this.status((err, status) => {
      done(err, status === 'running')
    })
  }

  start(done) {
    this.command(['start', this.name], (err) => {
      if (HOST_NON_EXISTENT.test(err)) {
        done(new Error(`Docker host "${this.name}" does not exist`))
      } else if (ALREADY_RUNNING.test(err)) {
        done()
      } else {
        done(err)
      }
    })
  }

  env(opts, done) {
    if (typeof opts === 'function') done = opts, opts = {}

    const args = ['env']

    if (opts.json) args.push('--shell', 'bash')
    else if (opts.shell) args.push('--shell', opts.shell)

    args.push(this.name)

    this.command(args, function (err, stdout) {
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

  ssh(cmd, done) {
    if (Array.isArray(cmd)) cmd = cmd.join(' ')
    this.command(['ssh', this.name, cmd], done)
  }
}

module.exports = Machine
