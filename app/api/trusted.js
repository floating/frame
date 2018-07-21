import store from '../store'

export default origin => {
  if (!origin || origin === 'null') origin = 'Unknown'
  let permissions = store('local.accounts', store('signer.accounts', 0), 'permissions') || {}
  let perms = Object.keys(permissions).map(id => permissions[id])
  let permIndex = perms.map(p => p.origin).indexOf(origin)
  if (permIndex === -1 && store('signer.current')) store.addRequest({type: 'requestProvider', origin})
  let trusted = store('signer.current') && perms[permIndex] && perms[permIndex].provider
  return trusted || false
}
