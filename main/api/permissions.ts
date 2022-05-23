import log from 'electron-log'

import accounts, { AccessRequest } from '../accounts'
import store from '../store'
import { getOriginId, invalidOrigin } from './origins'

function addPermissionRequest (address: Address, origin: string) {
  return new Promise((resolve, reject) => {
    const handlerId = getOriginId(origin)
    const request: AccessRequest = { payload: undefined as any, handlerId, type: 'access', origin: handlerId, account: address }

    accounts.addRequest(request, () => {
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

export async function isTrusted (origin?: string) {
  if (!origin || origin === 'null') origin = OriginType.Unknown // Permission granted to unknown origins only persist until the Frame is closed, they are not permanent
  if (invalidOrigin(origin)) return false
  if (origin === OriginType.FrameExtension) return true
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
