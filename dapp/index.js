import * as Sentry from '@sentry/electron'
import React from 'react'
import { createRoot } from 'react-dom/client'
import Restore from 'react-restore'

import App from './App'

import link from '../resources/link'
import _store from './store'

Sentry.init({ dsn: 'https://7b09a85b26924609bef5882387e2c4dc@o1204372.ingest.sentry.io/6331069' })

document.addEventListener('dragover', e => e.preventDefault())
document.addEventListener('drop', e => e.preventDefault())
window.eval = global.eval = () => { throw new Error(`This app does not support window.eval()`) } // eslint-disable-line

link.rpc('getFrameId', (err, frameId) => {
  if (err) return console.error('Could not get frameId from main', err)
  window.frameId = frameId
  link.rpc('getState', (err, state) => {
    if (err) return console.error('Could not get initial state from main')
    const store = _store(state)
    window.store = store
    store.observer(() => {
      document.body.className = 'clip ' + store('main.colorway')
      setTimeout(() => {
        document.body.className = store('main.colorway')
      }, 100)
    })
    const DappFrame = Restore.connect(App, store)
    const root = createRoot(document.getElementById('frame'));
    root.render(<DappFrame />)
  })
})

document.addEventListener('contextmenu', e => link.send('*:contextmenu', e.clientX, e.clientY))
