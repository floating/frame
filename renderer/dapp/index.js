import * as Sentry from '@sentry/electron'
import React from 'react'
import { createRoot } from 'react-dom/client'
import Restore from 'react-restore'

import App from '../../app/Dapp'

import link from '../../resources/link'
import appStore from '../../app/store'

Sentry.init({ dsn: 'https://7b09a85b26924609bef5882387e2c4dc@o1204372.ingest.sentry.io/6331069' })

document.addEventListener('dragover', (e) => e.preventDefault())
document.addEventListener('drop', (e) => e.preventDefault())

if (process.env.NODE_ENV !== 'development' || process.env.HMR !== 'true') {
  window.eval = global.eval = () => {
    throw new Error(`This app does not support window.eval()`)
  } // eslint-disable-line
}

link.rpc('getFrameId', (err, frameId) => {
  if (err) return console.error('Could not get frameId from main', err)
  window.frameId = frameId
  link.rpc('getState', (err, state) => {
    if (err) return console.error('Could not get initial state from main')
    const store = appStore(state)
    window.store = store
    store.observer(() => {
      document.body.classList.add('clip', storeInstance('main.colorway'))
      setTimeout(() => {
        document.body.classList.remove('clip')
      }, 100)
    })
    const Dapp = Restore.connect(App, store)
    const root = createRoot(document.getElementById('dapp'))
    root.render(<Dapp />)
  })
})

document.addEventListener('contextmenu', (e) => link.send('*:contextmenu', e.clientX, e.clientY))
