/* globals */

import EventEmitter from 'events'
import Restore from 'react-restore'

import link from '../../resources/link'
import * as actions from './actions'

export default (state, cb) => {
  const store = Restore.create(state, actions)
  store.events = new EventEmitter()

  // Feed for relaying state updates
  // store.api.feed((state, actions, obscount) => {
  //   actions.forEach(action => {
  //     action.updates.forEach(update => {
  //       // console.log(update)
  //       // if (update.path.startsWith('main')) return
  //       // if (update.path.startsWith('panel')) return
  //       // link.send('tray:syncPath', update.path, update.value)
  //     })
  //   })
  // })

  link.on('action', (action, ...args) => {
    if (store[action]) store[action](...args)
  })
  link.send('tray:ready') // turn on api

  link.send('tray:refreshMain')

  return store
}
