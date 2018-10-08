const dev = process.env.NODE_ENV === 'development'

const extOrigins = ['chrome-extension://adpbaaddjmehiidelapmmnjpmehjiifg', 'moz-extension://7b2a0cf9-245a-874b-8f58-4a7e3d04c70f']

module.exports = origin => {
  // For dev
  if (origin.indexOf('chrome-extension://') > -1 || origin.indexOf('moz-extension://') > -1) return true
  if (extOrigins.indexOf(origin) > -1) return true
  return false
}
