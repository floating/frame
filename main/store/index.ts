import Restore from 'react-restore'
import state from './state'
import * as actions from './actions'
import persist from './persist'

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

// Persist initial full state
persist.set('main', store('main'))

// Apply updates to persisted state
store.api.feed((state, actionBatch) => {
  actionBatch.forEach((action) => {
    action.updates.forEach((update) => {
      persist.queue(update.path, update.value)
    })
  })
})

export default store
