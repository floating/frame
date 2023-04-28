import EventEmitter from 'events'

// in process message passing to simulate the ability of the parent
// and child process to communicate via IPC
const childProcessHandle = new EventEmitter()
const forkedProcess = new EventEmitter()

forkedProcess.send = (msg) => childProcessHandle.emit('message', msg)
forkedProcess.kill = () => {
  forkedProcess.removeAllListeners()
  childProcessHandle.emit('close')
}

childProcessHandle.send = jest.fn((msg) => forkedProcess.emit('message', msg))
childProcessHandle.disconnect = () => forkedProcess.kill()
childProcessHandle.kill = jest.fn()

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
