import { webFrame } from 'electron'

import './iso'
import state from './state'
import './api'

const _setImmediate = setImmediate
process.once('loaded', () => { global.setImmediate = _setImmediate })
webFrame.executeJavaScript(`window.frameState = ${JSON.stringify(state())}`)
