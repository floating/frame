import RingSignerWorker from '../../RingSigner/worker'
import SeedSignerWorker from '../../SeedSigner/worker'
import launchController from './controller'

import type { WorkerRPCMessage, WorkerTokenMessage } from '../types'

const signerType = process.argv[2] as HotSignerType
let worker

if (signerType === 'seed') {
  worker = new SeedSignerWorker()
}

if (signerType === 'ring') {
  worker = new RingSignerWorker()
}

if (!worker) {
  process.exit(3)
}

const ipc = {
  send: (message: WorkerTokenMessage | WorkerRPCMessage) => {
    if (process.send) process.send(message)
  },
  on: process.on.bind(process)
}

launchController(worker, ipc)
