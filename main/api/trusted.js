const { v5: uuidv5 } = require('uuid')

const store = require('../store')
const accounts = require('../accounts')
const provider = require('../provider')

const invalidOrigin = o => o !== o.replace(/[^0-9a-z/:.[\]-]/gi, '')

const getAccount = () => {
  return new Promise((resolve, reject) => {
    const account = accounts.current()
    if (account) return resolve(account)
    const clear = () => {
      clearTimeout(accountTimer)
      provider.removeListener('data:accounts', accountSelected)
    }
    const accountTimer = setTimeout(() => {
      clear()
      reject(new Error('No Frame account is selected'))
    }, 30 * 1000)
    const accountSelected = () => {
      const account = accounts.current()
      if (!account) return reject(new Error('No Frame account is selected'))
      resolve(account)
    }
    provider.on('data:accounts', accountSelected)
  })
}

const checkPermissions = (account, origin) => {
  const address = account.addresses[account.index]
  const permissions = store('main.addresses', address, 'permissions') || {}
  const perms = Object.keys(permissions).map(id => permissions[id])
  perms.push({ origin: 'http://localhost:8421', provider: true })
  const permIndex = perms.map(p => p.origin).indexOf(origin)
  return permIndex > -1
}

const getPermission = (account, origin) => {
  return new Promise((resolve, reject) => {
    const address = account.addresses[account.index]
    let requested = false
    const permissionTimer = setTimeout(() => {
      clearTimeout(permissionTimer)
      permissionObserver.remove()
      return reject(new Error('No Frame account is selected'))
    }, 5 * 1000)
    const permissionObserver = store.observer(() => {
      let trusted = checkPermissions(account, origin)
      if (trusted) {
        resolve(true)
        clearTimeout(permissionTimer)
        setTimeout(() => permissionObserver.remove(), 0)
      } else if (!requested) {
        const handlerId = uuidv5(origin, uuidv5.DNS)
        accounts.addRequest({ handlerId, type: 'access', origin, address })
        requested = true
      }
    })
  })
}

const trusted = async origin => {
  if (!origin || origin === 'null') origin = 'Unknown' // Permission granted to unknown origins only persist until the Frame is closed, they are not permanent
  if (invalidOrigin(origin)) return false
  if (origin === 'frame-extension') return true
  const account = await getAccount()
  const trusted = await getPermission(account, origin)
  return trusted
}

module.exports = trusted
