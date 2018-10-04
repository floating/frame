const uuidv5 = require('uuid/v5')

const store = require('../store')
const windows = require('../windows')

const invalidOrigin = o => o !== o.replace(/[^0-9a-z/:.[\]-]/gi, '')
const extOrigins = ['chrome-extension://adpbaaddjmehiidelapmmnjpmehjiifg', 'moz-extension://fc369fbc-e505-e14f-a079-fe23932d9044']

module.exports = origin => {
  if (!origin || origin === 'null') origin = 'Unknown' // Permission granted to unknown origins only persist until the Frame is closed, they are not permanent
  if (invalidOrigin(origin)) return false
  if (extOrigins.indexOf(origin) > -1) return true
  let permissions = store('local.accounts', store('signer.accounts', 0), 'permissions') || {}
  let perms = Object.keys(permissions).map(id => permissions[id])
  let permIndex = perms.map(p => p.origin).indexOf(origin)
  let handlerId = uuidv5(origin, uuidv5.DNS)
  if (permIndex === -1 && store('signer.current') && !store('signer.requests', handlerId)) windows.broadcast('main:action', 'addRequest', { handlerId, type: 'requestProvider', origin })
  let trusted = store('signer.current') && perms[permIndex] && perms[permIndex].provider
  return trusted
}
