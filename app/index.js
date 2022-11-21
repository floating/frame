import * as Sentry from '@sentry/electron'
import React from 'react'
import { createRoot } from 'react-dom/client'
import Restore from 'react-restore'

import App from './App'

import link from '../resources/link'
import _store from './store'

Sentry.init({ dsn: 'https://7b09a85b26924609bef5882387e2c4dc@o1204372.ingest.sentry.io/6331069' })

// window.removeAllAccountsAndSigners = () => link.send('tray:removeAllAccountsAndSigners')

document.addEventListener('dragover', e => e.preventDefault())
document.addEventListener('drop', e => e.preventDefault())
window.eval = global.eval = () => { throw new Error(`This app does not support window.eval()`) } // eslint-disable-line

link.rpc('getState', (err, state) => {
  if (err) return console.error('Could not get initial state from main.')
  const store = _store(state)
  if (!store('main.mute.betaDisclosure')) store.notify('betaDisclosure')
  if (!store('main.mute.aragonAccountMigrationWarning')) store.notify('aragonAccountMigrationWarning')
  store.observer(() => {
    document.body.classList.remove('dark', 'light')
    document.body.classList.add('clip', store('main.colorway'))
    setTimeout(() => {
      document.body.classList.remove('clip')
    }, 100)
  })
  store.observer(() => {
    if (store('tray.open')) {
      document.body.classList.remove('suspend')
    } else {
      document.body.classList.add('suspend')
    }
  })
  const Frame = Restore.connect(App, store)
  const root = createRoot(document.getElementById('frame'));
  root.render(<Frame />)
})
// document.addEventListener('mouseover', e => link.send('tray:focus'))
document.addEventListener('mouseout', e => { if (e.clientX < 0) link.send('tray:mouseout') })
document.addEventListener('contextmenu', e => link.send('*:contextmenu', e.clientX, e.clientY))
