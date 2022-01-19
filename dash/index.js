import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import _store from './store'
import link from '../resources/link'

import App from './App'

document.addEventListener('dragover', e => e.preventDefault())
document.addEventListener('drop', e => e.preventDefault())
window.eval = global.eval = () => { throw new Error(`This app does not support window.eval()`) } // eslint-disable-line
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
  const Flow = Restore.connect(App, store)
  ReactDOM.render(<Flow />, document.getElementById('flow'))
})

document.addEventListener('contextmenu', e => link.send('*:contextmenu', e.clientX, e.clientY))

// document.addEventListener('mouseout', e => { if (e.clientX < 0) link.send('tray:mouseout') })
// document.addEventListener('contextmenu', e => link.send('tray:contextmenu', e.clientX, e.clientY))
