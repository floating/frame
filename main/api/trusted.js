const { v5: uuidv5 } = require('uuid')

const store = require('../store').default
const accounts = require('../accounts').default

const log = require('electron-log')

const invalidOrigin = o => o !== o.replace(/[^0-9a-z/:.[\]-]/gi, '')

const addPermissionRequest = (address, origin) => {
  return new Promise((resolve, reject) => {
    const handlerId = uuidv5(origin, uuidv5.DNS)
    accounts.addRequest({ handlerId, type: 'access', origin, address }, () => {
      const permissions = store('main.permissions', address) || {}
      const perms = Object.keys(permissions).map(id => permissions[id])
      const permIndex = perms.map(p => p.origin).indexOf(origin)
      if (perms[permIndex] && perms[permIndex].provider) {
        resolve(true)
      } else {
        reject(new Error('Origin does not have provider permissions'))
      }
    })
  })
}

module.exports = async origin => {
  if (!origin || origin === 'null') origin = 'Unknown' // Permission granted to unknown origins only persist until the Frame is closed, they are not permanent
  if (invalidOrigin(origin)) return false
  if (origin === 'frame-extension') return true
  const account = accounts.current()
  if (!account) return
  const address = account.address
  if (!address) return
  const permissions = store('main.permissions', address) || {}
  const perms = Object.keys(permissions).map(id => permissions[id])
  const permIndex = perms.map(p => p.origin).indexOf(origin)
  if (permIndex === -1) {
    try {
      return await addPermissionRequest(address, origin)
    } catch (e) {
      log.error(e)
      return false
    }
  } else {
    return perms[permIndex] && perms[permIndex].provider
  }
}
