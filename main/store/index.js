const Restore = require('react-restore')
const state = require('./state')
const actions = require('./actions')
const persist = require('./persist')

// TODO: Layer persisted op top of initial state

// const get = (path, obj = persist.get('main')) => {
//   path.split('.').some((key, i) => {
//     if (typeof obj !== 'object') { obj = undefined } else { obj = obj[key] }
//     return obj === undefined // Stop navigating the path if we get to undefined value
//   })
//   return obj
// }

// const persistedPaths = []

// persistedPaths.forEach(path => {
//   const value = get(path)
//   if (value !== undefined) store.__overwrite(path, value)
// })

const store = Restore.create(state(), actions)

store.api.feed((state, actions) => {
  actions.forEach(action => {
    action.updates.forEach(update => {
      persist.set(update.path, update.value)
    })
  })
})

module.exports = store
