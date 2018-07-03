import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'
import { ipcRenderer } from 'electron'

import App from './App'
import Panel from './App/Panel'

import api from './api'
import webview from './webview'
import store from './store'

if (process.env.NODE_ENV === 'development') {
  const electronHot = require('electron-hot-loader')
  electronHot.install()
  electronHot.watchJsx(['../bundle/*.js'])
  electronHot.watchCss(['../bundle/*.css'])
}

process.env.FRAME_TYPE = 'tray' // fix later
let tray = process.env.FRAME_TYPE === 'tray'
tray ? api() : webview()
let Frame = Restore.connect(tray ? Panel : App, store)
ReactDOM.render(<Frame />, document.getElementById('frame'))

if (tray) {
  ipcRenderer.on('main:trayOpen', (sender, open) => {
    store.trayOpen(open)
    if (open) store.setSignerView('default')
  })
  setTimeout(() => store.trayOpen(true), 10)
}
