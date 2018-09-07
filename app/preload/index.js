import { ipcRenderer, remote, shell } from 'electron'
import PersistStore from 'electron-store'

import rpc from './rpc'
import store from './store'
import api from './api'

const _setImmediate = setImmediate
process.once('loaded', () => { global.setImmediate = _setImmediate })

api()

const externalWhitelist = [
  'https://frame.sh',
  'https://chrome.google.com/webstore/detail/frame-alpha/ldcoohedfbjoobcadoglnnmmfbdlmmhf',
  'https://github.com/floating/frame/issues/new',
  'https://gitter.im/framehq/general'
]

ipcRenderer.on('main:trayOpen', (sender, open) => {
  store.trayOpen(open)
  if (open) store.setSignerView('default')
})

window.frame = {
  rpc,
  store,
  process: {
    quit: () => ipcRenderer.send('tray:quit'),
    resetAllSettings: () => {
      const persist = new PersistStore()
      persist.clear()
      remote.app.relaunch()
      remote.app.exit(0)
    },
    openExternal: url => {
      if (externalWhitelist.indexOf(url) > -1) shell.openExternal(url)
    }
  }
}
