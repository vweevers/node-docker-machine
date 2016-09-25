'use strict';

const path = require('path')
    , fs = require('fs')
    , env = process.env
    , cp = require('child_process')
    , camelCase = require('camel-case')
    , parallel = require('run-parallel-limit')
    , xtend = require('xtend')

const HOST_NON_EXISTENT = /host does not exist/i
    , ALREADY_RUNNING = /already running/i
    , NEWLINE = /\r?\n/
    , LIST_COLUMNS_SEP = ','

const LIST_COLUMNS
  = [ 'Name'
    , 'Active'
    , 'ActiveHost'
    , 'ActiveSwarm'
    , 'DriverName'
    , 'State'
    , 'URL'
    , 'Swarm'
    , 'Error'
    , 'DockerVersion'
    , 'ResponseTime' ]

class Machine {
  constructor(opts) {
    opts = Machine.options(opts)
    this.name = opts.name || env.DOCKER_MACHINE_NAME || 'default'
  }

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

  static inspect(name, done) {
    Machine.command(['inspect', name], (err, stdout) => {
      if (err) return done(err)

      try {
        var data = JSON.parse(stdout.trim())
      } catch (err) {
        return done(err)
      }

      done(null, merge({}, data))
    })
  }

  static list(opts, done) {
    if (typeof opts === 'function') done = opts, opts = {}

    // Build template, escape values with URL encoding
    const template = LIST_COLUMNS.map(name => {
      if (name === 'ResponseTime') {
        return `{{ .${name} | printf "%d" }}`
      } else {
        return `{{ .${name} | urlquery }}`
      }
    }).join(LIST_COLUMNS_SEP)

    const args = ['ls', '-f', template]

    // Optionally add a timeout (in seconds)
    // to deal with docker/machine#1696.
    if (opts.timeout) args.push('-t', String(opts.timeout))

    Machine.command(args, (err, stdout) => {
      if (err) return done(err)

      const machines = stdout.split(NEWLINE).filter(Boolean).map(line => {
        const values = line.split(LIST_COLUMNS_SEP)
            , machine = {}

        LIST_COLUMNS.forEach((name, i) => {
          const key = camelCase(name)
          const val = values[i]

          machine[key] = val === '' ? null : decodeURIComponent(val)
        })

        // ResponseTime is in nanoseconds
        machine.responseTime = parseInt(machine.responseTime) / 1e6
        machine.state = machine.state.toLowerCase()
        machine.activeHost = machine.activeHost === 'true'
        machine.activeSwarm = machine.activeSwarm === 'true'

        if (machine.dockerVersion === 'Unknown') {
          machine.dockerVersion = null
        }

        return machine
      })

      if (!opts.inspect) return done(null, machines)

      // Add additional metadata from `docker-machine inspect <name>`
      parallel(machines.map(machine => next => {
        Machine.inspect(machine.name, (err, data) => {
          if (err) next(err)
          else next(null, xtend(machine, data))
        })
      }), 4, done)
    })
  }
}

;['status', 'isRunning', 'start', 'env', 'ssh', 'inspect'].forEach(method => {
  Machine.prototype[method] = function () {
    const args = Array.from(arguments)
    args.unshift(this.name)
    Machine[method].apply(null, args)
  }
})

module.exports = Machine

function merge(node, data) {
  for(let key in data) {
    const val = data[key]
    node[camelCase(key)] = isObject(val) ? merge({}, val) : val
  }

  return node
}

function isObject(obj) {
  return typeof obj === 'object' && obj !== null
}
