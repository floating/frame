import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'

import App from './App'
import Panel from './App/Panel'

import './ws'
import webview from './webview'
import store from './store'

import './style'

let tray = process.env.FRAME_TYPE === 'tray'
if (!tray) webview()
let Frame = Restore.connect(tray ? Panel : App, store)
ReactDOM.render(<Frame />, document.getElementById('frame'))
