'use strict';

const test = require('tape')
    , fs = require('fs')
    , path = require('path')
    , proxyquire =  require('proxyquire')
    , spies = []
    , Machine = proxyquire('../', { child_process: createMock(spies) })

test('name defaults to DOCKER_MACHINE_NAME or "default"', function (t) {
  t.plan(6)

  process.env.DOCKER_MACHINE_NAME = 'beep'

  t.is(new Machine().name, 'beep', 'DOCKER_MACHINE_NAME')
  t.is(new Machine('agent').name, 'agent', 'as string')
  t.is(new Machine({ name: 'agent' }).name, 'agent', 'as option')

  process.env.DOCKER_MACHINE_NAME = ''

  t.is(new Machine().name, 'default', 'default')
  t.is(new Machine('agent').name, 'agent', 'as string')
  t.is(new Machine({ name: 'agent' }).name, 'agent', 'as option')
})

test('cwd defaults to DOCKER_TOOLBOX_INSTALL_PATH or cwd', function (t) {
  t.plan(6)

  process.env.DOCKER_TOOLBOX_INSTALL_PATH = '/docker'

  const s1 = spy({ result: 'fake1' })
  const s2 = spy({ result: 'fake2' })

  Machine.command('anything1', (err, res) => {
    t.is(res, 'fake1')
    t.same(s1.args, ['anything1'])
    t.is(s1.opts.cwd, '/docker', 'DOCKER_TOOLBOX_INSTALL_PATH')
  })

  process.env.DOCKER_TOOLBOX_INSTALL_PATH = ''

  Machine.command('anything2', (err, res) => {
    t.is(res, 'fake2')
    t.same(s2.args, ['anything2'])
    t.is(s2.opts.cwd, '.', 'cwd')
  })
})

test('status', function (t) {
  t.plan(6)

  const s1 = spy({ result: ' running\n' })
  const s2 = spy({ result: 'Stopped' })

  Machine.status('beep', (err, status) => {
    t.ifError(err, 'no status error')
    t.is(status, 'running', 'trimmed')
    t.same(s1.args, ['status', 'beep'])
  })

  new Machine().status((err, status) => {
    t.ifError(err, 'no status error')
    t.is(status, 'stopped', 'lowercased')
    t.same(s2.args, ['status', 'default'])
  })
})

test('isRunning', function (t) {
  t.plan(6)

  const s1 = spy({ result: ' running\n' })
  const s2 = spy({ result: 'Stopped' })

  Machine.isRunning('beep', (err, running) => {
    t.ifError(err, 'no isRunning error')
    t.is(running, true, 'running')
    t.same(s1.args, ['status', 'beep'])
  })

  new Machine().isRunning((err, running) => {
    t.ifError(err, 'no isRunning error')
    t.is(running, false, 'not running')
    t.same(s2.args, ['status', 'default'])
  })
})

test('start', function (t) {
  t.plan(10)

  const s1 = spy({})
  const s2 = spy({})
  const s3 = spy({ error: new Error('\nhost does not exist abc') })
  const s4 = spy({ error: new Error('\nalready running abc') })
  const s5 = spy({ error: new Error('other error') })

  Machine.start('beep', (err) => {
    t.ifError(err, 'no start error')
    t.same(s1.args, ['start', 'beep'])
  })

  new Machine().start(err => {
    t.ifError(err, 'no start error')
    t.same(s2.args, ['start', 'default'])
  })

  Machine.start('boop', (err) => {
    t.is(err.message, 'Docker host "boop" does not exist', 'non existent error')
    t.same(s3.args, ['start', 'boop'])
  })

  new Machine().start(err => {
    t.ifError(err, 'no start error if already started')
    t.same(s4.args, ['start', 'default'])
  })

  Machine.start('four', (err) => {
    t.is(err.message, 'other error', 'passthrough other error')
    t.same(s5.args, ['start', 'four'])
  })
})

test('env', function (t) {
  t.plan(6)

  const s1 = spy({ result: fixture('env-windows.txt') })
  const s2 = spy({ result: fixture('env-bash.txt') })

  Machine.env('beep', (err, result) => {
    t.ifError(err, 'no env error')
    t.is(result, s1.result)
    t.same(s1.args, ['env', 'beep'])
  })

  new Machine().env((err, result) => {
    t.ifError(err, 'no env error')
    t.is(result, s2.result)
    t.same(s2.args, ['env', 'default'])
  })
})

test('env as json', function (t) {
  t.plan(6)

  const s1 = spy({ result: fixture('env-bash.txt') })
  const s2 = spy({ result: fixture('env-bash.txt') })

  Machine.env('beep', { json: true }, (err, result) => {
    t.ifError(err, 'no env error')
    t.same(result, {
      DOCKER_TLS_VERIFY: '1',
      DOCKER_HOST: 'tcp://<ip>:<port>',
      DOCKER_CERT_PATH: '<home>/.docker/machine/machines/<name>',
      DOCKER_MACHINE_NAME: '<name>'
    })
    t.same(s1.args, ['env', '--shell', 'bash', 'beep'])
  })

  new Machine().env({ json: true }, (err, result) => {
    t.ifError(err, 'no env error')
    t.same(result, {
      DOCKER_TLS_VERIFY: '1',
      DOCKER_HOST: 'tcp://<ip>:<port>',
      DOCKER_CERT_PATH: '<home>/.docker/machine/machines/<name>',
      DOCKER_MACHINE_NAME: '<name>'
    })
    t.same(s2.args, ['env', '--shell', 'bash', 'default'])
  })
})

test('env with custom shell', function (t) {
  t.plan(2)

  const s1 = spy({ result: '' })

  Machine.env('beep', { shell: 'fish' }, (err, result) => {
    t.ifError(err, 'no env error')
    t.same(s1.args, ['env', '--shell', 'fish', 'beep'])
  })
})

test('env as json overrides custom shell', function (t) {
  t.plan(3)

  const s1 = spy({ result: fixture('env-bash.txt') })

  Machine.env('beep', { json: true, shell: 'fish' }, (err, result) => {
    t.ifError(err, 'no env error')
    t.same(s1.args, ['env', '--shell', 'bash', 'beep'])
    t.same(result, {
      DOCKER_TLS_VERIFY: '1',
      DOCKER_HOST: 'tcp://<ip>:<port>',
      DOCKER_CERT_PATH: '<home>/.docker/machine/machines/<name>',
      DOCKER_MACHINE_NAME: '<name>'
    })
  })
})

function spy(state) {
  spies.push(state)
  return state
}

function createMock(spies) {
  return {
    execFile(cmd, args, opts, done) {
      const state = spies.shift()

      state.cmd = cmd
      state.args = args
      state.opts = opts

      process.nextTick(done, state.error || null, state.result)
    }
  }
}

function fixture(name) {
  const file = path.join(__dirname, 'fixture', name)
  return fs.readFileSync(file, 'utf8').trim()
}
