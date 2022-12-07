import * as Sentry from '@sentry/electron'
import React from 'react'
import { createRoot } from 'react-dom/client'
import Restore from 'react-restore'

import _store from './store'
import link from '../resources/link'

const isTray = window.frameWindow === 'tray'

// Map instead of one-liner because using vars in dynamic import urls breaks Parcel
// https://github.com/parcel-bundler/parcel/issues/112#issuecomment-1056869249
const importMap = {
  tray: () => import('./Tray'),
  dash: () => import('./Dash'),
  dapp: () => import('./Dapp'),
  dawn: () => import('./Dawn'),
  flow: () => import('./Flow')
}

Sentry.init({ dsn: 'https://7b09a85b26924609bef5882387e2c4dc@o1204372.ingest.sentry.io/6331069' })

document.addEventListener('dragover', (e) => e.preventDefault())
document.addEventListener('drop', (e) => e.preventDefault())

if (process.env.NODE_ENV !== 'development' || process.env.HMR !== 'true') {
  window.eval = global.eval = () => {
    throw new Error(`This app does not support window.eval()`)
  } // eslint-disable-line
}

link.rpc('getState', (err, state) => {
  if (err) return console.error('Could not get initial state from main')
  const store = _store(state)

  if (isTray) {
    link.send('tray:ready') // turn on api
    link.send('tray:refreshMain')
    if (!store('main.mute.betaDisclosure')) store.notify('betaDisclosure')
    if (!store('main.mute.aragonAccountMigrationWarning')) store.notify('aragonAccountMigrationWarning')
  }

  window.store = store
  store.observer(() => {
    document.body.classList.remove('dark', 'light')
    document.body.classList.add('clip', store('main.colorway'))
    setTimeout(() => {
      document.body.classList.remove('clip')
    }, 100)
  })

  if (isTray) {
    store.observer(() => {
      if (store('tray.open')) {
        document.body.classList.remove('suspend')
      } else {
        document.body.classList.add('suspend')
      }
    })
  }
  ;(async () => {
    const AppComponent = (await importMap[window.frameWindow]()).default
    const RootComponent = Restore.connect(AppComponent, store)
    const root = createRoot(document.getElementById(window.frameWindow))
    root.render(<RootComponent />)
  })()
})

if (isTray) {
  document.addEventListener('mouseout', (e) => {
    if (e.clientX < 0) link.send('tray:mouseout')
  })
}

document.addEventListener('contextmenu', (e) => link.send('*:contextmenu', e.clientX, e.clientY))

// document.addEventListener('mouseout', e => { if (e.clientX < 0) link.send('tray:mouseout') })
// document.addEventListener('contextmenu', e => link.send('tray:contextmenu', e.clientX, e.clientY))
