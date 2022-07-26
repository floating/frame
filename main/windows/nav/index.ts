// Listeners and helpers to manage navigation states for each window

import { ipcMain } from 'electron'

import store from '../../store'

interface Crumb {
  view: string
}

const nav = {
  forward: (windowId: string, crumb: Crumb) => {
    if (windowId === 'panel') {
      store.navForward('panel', crumb)
    } else if (windowId === 'dash') {
      store.navDash(crumb)
    }
  },
  back: (windowId: string) => {
    store.navBack(windowId)
  },
  update: (windowId: string, crumb: Crumb, navigate: boolean = true) => {
    store.navUpdate(windowId, crumb, navigate)
  }
}

ipcMain.on('nav:forward', (e, windowId: string, crumb: Crumb) => {
  nav.forward(windowId, crumb)
})

ipcMain.on('nav:back', (e, windowId: string) => {
  nav.back(windowId)
})

ipcMain.on('nav:update', (e, windowId: string, crumb: Crumb, navigate: boolean) => {
  nav.update(windowId, crumb, navigate)
})

export default nav