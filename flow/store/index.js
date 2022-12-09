// import Restore from 'react-restore'
// import * as actions from './actions'
// export default (state) => Restore.create(state, actions)

/* globals fetch */

import EventEmitter from 'events'
import Restore from 'react-restore'

import link from '../../resources/link'
import * as actions from './actions'

export default (state, cb) => {
  const store = Restore.create(state, actions)
  store.events = new EventEmitter()

  // Feed for relaying state updates
  store.api.feed((state, actions, obscount) => {
    actions.forEach((action) => {
      action.updates.forEach((update) => {
        if (update.path.startsWith('main')) return
        link.send('tray:syncPath', update.path, update.value)
      })
    })
  })

  link.on('action', (action, ...args) => {
    if (store[action]) store[action](...args)
  })

  return store
}
