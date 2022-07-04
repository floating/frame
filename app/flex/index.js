// Access browser specific libraries from the main process
// Helpful when only a browser library is avliable...
// or when a particular Chrome API like web-bluetooth may be a more stable option cross platform
import link from '../../resources/link'

// Flexed Libs
// import Ledger from './ledger'
import Trezor from './trezor'

// Emitter Transport
const emit = (eventName, ...args) => {
  // console.log('emit', eventName, ...args)
  link.send('tray:flex:event', eventName, ...args.map((arg) => (arg instanceof Error ? wrap(arg.message) : wrap(arg))))
}

const flex = {
  // ledger: new Ledger(emit),
  trezor: new Trezor(emit),
}

const unwrap = (v) => (v !== undefined || v !== null ? JSON.parse(v) : v)
const wrap = (v) => (v !== undefined || v !== null ? JSON.stringify(v) : v)

link.on('flex', (id, target, ...args) => {
  id = unwrap(id)
  target = unwrap(target)
  const lib = target.split('.')[0]
  const method = target.split('.')[1]
  args = args.map((arg) => unwrap(arg))
  if (flex[lib] && flex[lib][method]) {
    flex[lib][method](...args, (...args) => {
      link.send('tray:flex:res', id, ...args.map((arg) => (arg instanceof Error ? wrap(arg.message) : wrap(arg))))
    })
  } else {
    const args = [new Error('Unknown flex lib:method: ' + target)]
    link.send('tray:flex:res', id, ...args.map((arg) => (arg instanceof Error ? wrap(arg.message) : wrap(arg))))
  }
})
