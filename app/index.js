import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'
import { ipcRenderer } from 'electron'

import Panel from './App/Panel'
import api from './api'
import store from './store'

api()
let Frame = Restore.connect(Panel, store)
ReactDOM.render(<Frame />, document.getElementById('frame'))
ipcRenderer.on('main:trayOpen', (sender, open) => {
  store.trayOpen(open)
  if (open) store.setSignerView('default')
})
setTimeout(() => store.trayOpen(true), 10)
