import ethProvider from 'eth-provider'

import provider from '../../main/provider'

jest.mock('../../main/windows', () => ({}))
jest.mock('../../main/windows/nav', () => ({}))
jest.mock('../../main/signers', () => ({}))
jest.mock('../../main/externalData')

//jest.mock('electron')

console.log(' ----> ', process.cwd())

let connection

beforeAll((done) => {
  provider.on('connect', () => {
    console.log('provider connected!')
    done()
  })
})

beforeEach(() => {
  connection = ethProvider('frame', { origin: 'test.frame.eth' })
})

it('accepts a request', async () => {

})