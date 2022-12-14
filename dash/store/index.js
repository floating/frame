// import Restore from 'react-restore'
// import * as actions from './actions'
// export default (state) => Restore.create(state, actions)

/* globals fetch */

import EventEmitter from 'events'
import Restore from 'react-restore'

import link from '../../resources/link'
import * as actions from './actions'

export default (state, cb) => {
  // console.log('state...', state)
  const store = Restore.create(state, actions)
  store.events = new EventEmitter()
  link.on('action', (action, ...args) => {
    if (store[action]) store[action](...args)
  })

  return store
}
