const EventEmitter = require('events')

const forkedChildProcess = new EventEmitter()
forkedChildProcess.kill = jest.fn()
forkedChildProcess.send = jest.fn()

module.exports = {
  _forkedChildProcess: forkedChildProcess,
  fork: jest.fn((path, args, opts) => {
    if (opts.signal) {
      opts.signal.onabort = () => {
        forkedChildProcess.kill('SIGABRT')
      }
    }

    return forkedChildProcess
  })
}
