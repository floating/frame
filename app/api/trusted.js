import store from '../store'
import uuidv5 from 'uuid/v5'

export default origin => {
  if (!(store('local.connection.local.status') === 'connected' || store('local.connection.secondary.status') === 'connected')) return false
  if (!origin || origin === 'null') origin = 'Unknown'
  let permissions = store('local.accounts', store('signer.accounts', 0), 'permissions') || {}
  let perms = Object.keys(permissions).map(id => permissions[id])
  let permIndex = perms.map(p => p.origin).indexOf(origin)
  let handlerId = uuidv5(origin, uuidv5.DNS)
  if (permIndex === -1 && store('signer.current') && !store('signer.requests', handlerId)) store.addRequest({handlerId, type: 'requestProvider', origin})
  let trusted = store('signer.current') && perms[permIndex] && perms[permIndex].provider
  return trusted || false
}
