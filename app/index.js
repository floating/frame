import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import App from './App'

import link from './link'
import _store from './store'

import './flex'

// window.removeAllAccountsAndSigners = () => link.send('tray:removeAllAccountsAndSigners')

document.addEventListener('dragover', e => e.preventDefault())
document.addEventListener('drop', e => e.preventDefault())
window.eval = global.eval = () => { throw new Error(`This app does not support window.eval()`) } // eslint-disable-line

link.rpc('getState', (err, state) => {
  if (err) return console.error('Could not get initial state from main.')
  const store = _store(state)
  document.addEventListener('mouseout', e => {
    if (e.clientX < (store('tray.dockOnly') ? 400 : 0)) link.send('tray:mouseout')
  })
  if (!store('main.mute.alphaWarning')) store.notify('mainnet')
  const Frame = Restore.connect(App, store)
  ReactDOM.render(<Frame />, document.getElementById('frame'))
})
document.addEventListener('contextmenu', e => link.send('tray:contextmenu', e.clientX, e.clientY))
