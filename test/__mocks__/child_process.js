import EventEmitter from 'events'

// in process message passing to simulate the ability of the parent
// and child process to communicate via IPC
const childProcessHandle = new EventEmitter()
const forkedProcess = new EventEmitter()

childProcessHandle.send = jest.fn((msg) => forkedProcess.emit('message', msg))
childProcessHandle.disconnect = jest.fn()
childProcessHandle.kill = jest.fn()

forkedProcess.send = (msg) => childProcessHandle.emit('message', msg)

const fork = jest.fn((path, args, opts = {}) => {
  if (opts.signal) {
    opts.signal.onabort = () => {
      childProcessHandle.kill('SIGABRT')
    }
  }

  forkedProcess.emit('start')

  return childProcessHandle
})

export { fork, childProcessHandle as _childProcessHandle, forkedProcess as _forkedChildProcess }
