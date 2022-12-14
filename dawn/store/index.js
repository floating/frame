/* globals fetch */

import EventEmitter from 'events'
import Restore from 'react-restore'

import link from '../../resources/link'
import * as actions from './actions'

export default (state, cb) => {
  const store = Restore.create(state, actions)
  link.on('action', (action, ...args) => {
    if (store[action]) store[action](...args)
  })
  store.events = new EventEmitter()
  return store
}
