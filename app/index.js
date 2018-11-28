import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import Panel from './App/Panel'

import link from './link'
import store from './store'

document.addEventListener('dragover', e => e.preventDefault())
document.addEventListener('drop', e => e.preventDefault())
window.eval = global.eval = () => { throw new Error(`This app does not support window.eval()`) } // eslint-disable-line

link.rpc('getState', (err, state) => {
  if (err) return console.error('Could not get initial state from main.')
  const Frame = Restore.connect(Panel, store(state))
  ReactDOM.render(<Frame />, document.getElementById('frame'))
})
