import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'
import { ipcRenderer } from 'electron'

import App from './App'
import Panel from './App/Panel'

import ws from './ws'
import webview from './webview'
import store from './store'

import './style'

let tray = process.env.FRAME_TYPE === 'tray'
tray ? ws() : webview()
let Frame = Restore.connect(tray ? Panel : App, store)
ReactDOM.render(<Frame />, document.getElementById('frame'))

if (tray) {
  ipcRenderer.on('main:trayOpen', (sender, open) => store.trayOpen(open))
  setTimeout(() => store.trayOpen(true), 10)
}
