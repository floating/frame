const log = require('electron-log')

module.exports = data => {
  let payload
  try {
    payload = JSON.parse(data)
  } catch (e) {
    log.info('Error parsing payload: ', data, e)
    return false
  }
  if (payload && typeof payload === 'object' && payload !== null && payload.id && payload.method) {
    if (!payload.params) payload.params = []
    if (!(typeof payload.id === 'number' || typeof payload.id === 'string')) return false
    if (typeof payload.jsonrpc !== 'string') return false
    if (typeof payload.method !== 'string') return false
    if (!Array.isArray(payload.params)) return false
    return payload
  } else {
    return false
  }
}
