import log from 'electron-log'
import WorkerProcess from '../../../main/worker/process'

jest.mock('child_process', () => ({
  fork: jest.fn(() => mockForkedProcess)
}))

let worker, mockForkedProcess

beforeAll(() => {
  log.transports.console.level = false
})

afterAll(() => {
  log.transports.console.level = 'debug'
})

beforeEach(() => {
  mockForkedProcess = {
    on: jest.fn(),
    once: jest.fn(),
    kill: jest.fn(),
    send: jest.fn()
  }
  
  worker = new WorkerProcess({ name: 'test-worker', module: './test.js' })
})

describe('#send', () => {
  it('sends a command and args to the worker process', () => {
    worker.send('testCommand', { fruit: 'orange' }, 'metadata')

    expect(mockForkedProcess.send).toHaveBeenCalledWith({
      command: 'testCommand',
      args: [{ fruit: 'orange' }, 'metadata']
    })
  })
})

describe('#kill', () => {
  it('emits an exit event', () => {
    let exitEmitted = false

    worker.once('exit', () => exitEmitted = true)
    worker.kill()

    expect(exitEmitted).toBe(true)
  })

  it('kills the worker process', () => {
    worker.kill('SIGHUP')

    expect(mockForkedProcess.kill).toHaveBeenCalledWith('SIGHUP')
  })

  it('removes listeners after emitting the exit event', () => {
    let numExitEvents = 0

    worker.on('exit', () => numExitEvents += 1)
    worker.kill()
    worker.kill()

    expect(numExitEvents).toBe(1)
  })
})
