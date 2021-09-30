import RequestQueue from '../../../../../main/signers/ledger/Ledger/requestQueue'

it('enqueues tasks', done => {
  const queue = new RequestQueue()

  queue.start()

  for (let i = 0; i < 10; i++) {
    const request = () => {
      console.log('this is #' + i)
      if (i === 9) done()
      return Promise.resolve()
    }

    queue.add(request)
  }
}, 10000)
