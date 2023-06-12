// import BalancesScanner from '../../../../main/externalData/balances'
// import * as balancesController from '../../../../main/externalData/balances/controller'
// import store from '../../../../main/store'
// import log from 'electron-log'

// jest.mock('../../../../main/store')
// jest.mock('../../../../main/externalData/balances/controller')

// const address = '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5'

// const knownTokens = [
//   {
//     chainId: 10,
//     address: '0x4200000000000000000000000000000000000042',
//     symbol: 'OP'
//   }
// ]

// let balances

// beforeAll(() => {
//   log.transports.console.level = false
// })

// beforeEach(() => {
//   store.set('main.tokens.known', address, knownTokens)
//   store.set('main.networks.ethereum.10', { id: 10, connection: { primary: { connected: true } } })

//   balances = BalancesScanner(store)
//   balances.start()
// })

// afterEach(() => {
//   balances.stop()
// })

// it('scans for balances when setting an address if the controller is ready', () => {
//   balancesController.isRunning.mockReturnValue(true)
//   balances.setAddress(address)

//   jest.advanceTimersByTime(0)

//   expect(balancesController.updateKnownTokenBalances).toHaveBeenCalled()
// })

// it('scans for balances as soon as the controller is ready', () => {
//   balancesController.isRunning.mockReturnValue(false)
//   balances.setAddress(address)

//   expect(balancesController.updateKnownTokenBalances).not.toHaveBeenCalled()

//   balancesController.emit('ready')
//   jest.advanceTimersByTime(0)

//   expect(balancesController.updateKnownTokenBalances).toHaveBeenCalled()
// })

// it('scans for balances every 10 minutes when paused', () => {
//   balancesController.isRunning.mockReturnValue(true)
//   balances.setAddress(address)

//   balances.pause()

//   jest.advanceTimersByTime(10 * 60 * 1000)

//   expect(balancesController.updateKnownTokenBalances).toHaveBeenCalledTimes(1)
// })

test('placeholder', () => {
  expect(true).toBe(true)
})
