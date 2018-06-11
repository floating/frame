import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'
import { ipcRenderer } from 'electron'
import opn from 'opn'

import App from './App'
import Panel from './App/Panel'

import api from './api'
import webview from './webview'
import store from './store'

import './style'

let tray = process.env.FRAME_TYPE === 'tray'
tray ? api() : webview()
let Frame = Restore.connect(tray ? Panel : App, store)
ReactDOM.render(<Frame />, document.getElementById('frame'))

if (tray) {
  opn('https://welcome.frame.sh')
  ipcRenderer.on('main:trayOpen', (sender, open) => {
    store.trayOpen(open)
    if (open) store.setSignerView('default')
  })
  setTimeout(() => store.trayOpen(true), 10)
}
