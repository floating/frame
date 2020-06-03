const { v5: uuidv5 } = require('uuid')

const store = require('../store')
const accounts = require('../accounts')
const provider = require('../provider')

const invalidOrigin = o => o !== o.replace(/[^0-9a-z/:.[\]-]/gi, '')

const reqInProgress = {

}

const getAccount = (origin) => {
  return new Promise((resolve, reject) => {
    // if (reqInProgress[origin]) return reject(new Error('Account request already in progress'))
    // reqInProgress[origin] = []
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
  const trustedIndex = perms.filter(p => p.provider).map(p => p.origin).indexOf(origin)
  const blockedIndex = perms.filter(p => !p.provider).map(p => p.origin).indexOf(origin)
  return trustedIndex > -1 ? 1 : blockedIndex > -1 ? -1 : 0
}

const getPermission = (account, origin) => {
  return new Promise((resolve, reject) => {
    const address = account.addresses[account.index]
    let requested = false
    const permissionTimer = setTimeout(() => {
      clearTimeout(permissionTimer)
      permissionObserver.remove()
      return reject(new Error('No Frame account is selected'))
    }, 45 * 1000)
    const permissionObserver = store.observer(() => {
      const check = checkPermissions(account, origin)
      if (check === 1) { // Trusted
        resolve(true)
        clearTimeout(permissionTimer)
        setTimeout(() => permissionObserver.remove(), 0)
      } else if (check === -1) { // Blocked
        reject(new Error('>>>>> Permission denied, approve http://localhost:1234 in Frame to continue'))
        clearTimeout(permissionTimer)
        setTimeout(() => permissionObserver.remove(), 0)
      } else {
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
  try {
    const account = await getAccount(origin)
    const trusted = await getPermission(account, origin)
    return trusted
  } catch (e) {
    return false
  } 
}

module.exports = trusted
