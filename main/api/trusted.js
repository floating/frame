const { v5: uuidv5 } = require('uuid')

const store = require('../store')
const accounts = require('../accounts')

const invalidOrigin = o => o !== o.replace(/[^0-9a-z/:.[\]-]/gi, '')

module.exports = origin => {
  if (!origin || origin === 'null') origin = 'Unknown' // Permission granted to unknown origins only persist until the Frame is closed, they are not permanent
  if (invalidOrigin(origin)) return false
  if (origin === 'frame-extension') return true
  const account = accounts.current()
  if (!account) return
  const address = account.addresses[account.index]
  if (!address) return
  const permissions = store('main.addresses', address, 'permissions') || {}
  const perms = Object.keys(permissions).map(id => permissions[id])
  perms.push({ origin: 'http://localhost:8421', provider: true })
  const permIndex = perms.map(p => p.origin).indexOf(origin)
  const handlerId = uuidv5(origin, uuidv5.DNS)
  if (permIndex === -1) accounts.addRequest({ handlerId, type: 'access', origin, address })
  return perms[permIndex] && perms[permIndex].provider
}
