import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import Panel from './App/Panel'

import store from './store'

document.addEventListener('dragover', e => e.preventDefault())
document.addEventListener('drop', e => e.preventDefault())
window.eval = global.eval = () => { throw new Error(`This app does not support window.eval()`) } // eslint-disable-line

const Frame = Restore.connect(Panel, store)
ReactDOM.render(<Frame />, document.getElementById('frame'))
setTimeout(() => store.trayOpen(true), 10)
