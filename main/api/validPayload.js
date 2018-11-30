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
    return payload
  } else {
    return false
  }
}
