import React from 'react'
import { createRoot } from 'react-dom/client'
import Restore from 'react-restore'

import _store from './store'
import link from '../resources/link'

import App from './App'

document.addEventListener('dragover', e => e.preventDefault())
document.addEventListener('drop', e => e.preventDefault())
window.eval = global.eval = () => { throw new Error(`This app does not support window.eval()`) } // eslint-disable-line
link.rpc('getState', (err, state) => {
  if (err) return console.error('Could not get initial state from main')
  console.log('initial state', state)
  const store = _store(state)
  window.store = store
  store.observer(() => {
    console.log('run observer')
    document.body.className = store('main.colorway')
  })
  const Flow = Restore.connect(App, store)
  const root = createRoot(document.getElementById('flow'))
  root.render(<Flow />)
})
// document.addEventListener('mouseout', e => { if (e.clientX < 0) link.send('tray:mouseout') })
// document.addEventListener('contextmenu', e => link.send('tray:contextmenu', e.clientX, e.clientY))
