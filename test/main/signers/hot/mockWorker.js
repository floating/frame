import EventEmitter from 'events'

export default function () {
  const workerResults = {}
  const mockWorker = new EventEmitter()

  mockWorker.disconnect = jest.fn()
  mockWorker.send = jest.fn((msg) => {
    const { id, method } = msg
    const results = workerResults[method] || []
    const result = results.splice(0, 1)[0]

    mockWorker.emit('message', {
      type: 'rpc',
      id,
      ...result
    })
  })

  mockWorker.addResult = (method, result) => {
    workerResults[method] = [...(workerResults[method] || []), { result }]
  }

  mockWorker.addError = (method, error) => {
    workerResults[method] = [...(workerResults[method] || []), { error }]
  }

  return mockWorker
}
