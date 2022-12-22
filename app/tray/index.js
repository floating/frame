import * as Sentry from '@sentry/electron'
import React from 'react'
import { createRoot } from 'react-dom/client'
import Restore from 'react-restore'

import App from './App'

import link from '../../resources/link'
import appStore from '../store'

Sentry.init({ dsn: 'https://7b09a85b26924609bef5882387e2c4dc@o1204372.ingest.sentry.io/6331069' })

document.addEventListener('dragover', (e) => e.preventDefault())
document.addEventListener('drop', (e) => e.preventDefault())

if (process.env.NODE_ENV !== 'development' || process.env.HMR !== 'true') {
  window.eval = global.eval = () => {
    throw new Error(`This app does not support window.eval()`)
  } // eslint-disable-line
}

function AppComponent() {
  return <App />
}

link.rpc('getState', (err, state) => {
  if (err) return console.error('Could not get initial state from main.')
  const store = appStore(state)
  link.send('tray:ready') // turn on api
  link.send('tray:refreshMain')
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
  const root = createRoot(document.getElementById('tray'))
  const Tray = Restore.connect(AppComponent, store)
  root.render(<Tray />)
})
// document.addEventListener('mouseover', e => link.send('tray:focus'))
document.addEventListener('mouseout', (e) => {
  if (e.clientX < 0) link.send('tray:mouseout')
})
document.addEventListener('contextmenu', (e) => link.send('*:contextmenu', e.clientX, e.clientY))
