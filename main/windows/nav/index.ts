// Listeners and helpers to manage navigation states for each window

import { ipcMain } from 'electron'

import store from '../../store'

interface Crumb {
  view: string,
  data: Object
}

const nav = {
  forward: (windowId: string, crumb: Crumb) => {
    console.log('nav forward', windowId, crumb)
    if (windowId === 'panel') {
      store.navForward('panel', crumb)
    } else if (windowId === 'dash') {
      store.navDash(crumb)
    }
  },
  back: (windowId: string) => {
    console.log('nav back', windowId)
    store.navBack(windowId)
  }
}

ipcMain.on('nav:forward', (e, windowId: string, crumb: Crumb) => {
  nav.forward(windowId, crumb)
})

ipcMain.on('nav:back', (e, windowId: string) => {
  nav.back(windowId)
})

export default nav