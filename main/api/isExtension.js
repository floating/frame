const dev = process.env.NODE_ENV === 'development'

const extOrigins = ['chrome-extension://adpbaaddjmehiidelapmmnjpmehjiifg', 'moz-extension://6b58ce8e-d95d-2e43-8451-03a8970e6e78']

module.exports = origin => {
  if (!origin) return false
  if (dev) {
    if (origin.indexOf('chrome-extension://') > -1 || origin.indexOf('moz-extension://') > -1) return true
  } else {
    if (extOrigins.indexOf(origin) > -1) return true
  }
  return false
}
