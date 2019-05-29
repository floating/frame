import 'babel-polyfill'

// Libraries
import TransportWebBLE from '@ledgerhq/hw-transport-web-ble'
import AppEth from '@ledgerhq/hw-app-eth'

class Ledger {
  constructor (emit) {
    this.emit = emit
  }
  test () {
    this.emit('ledger:device', { hi: 'hello' })
  }
  async scan () {
    let cancled = false
    console.log('scanning')
    const error = err => {
      cancled = true
      this.emit('ledger:scan:failed', err)
      console.warn('Failed: ' + err.message)
    }
    try {
      const timer = setTimeout(() => {
        if (cancled) return
        error(new Error('Time limit reached...'))
      }, 20000)
      const transport = await TransportWebBLE.create()
      if (cancled) return
      const eth = new AppEth(transport)
      const path = `44'/60'/0'/0/0` // HD derivation path
      const result = await eth.getAddress(path, false, true)
      if (cancled) return
      clearTimeout(timer)
      this.emit('ledger:device:added', result)
    } catch (err) {
      error(err)
    }
  }
}

module.exports = Ledger

// Events

// 'ledger:device:added'
//   -  { address }
// 'ledger:device:removed'
//   -  id
// 'ledger:device:changed'
//   -  { address }
