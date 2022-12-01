// Manage navigation states for each window

import { ipcMain } from 'electron'

import store from '../../store'
import type { Breadcrumb } from './breadcrumb'

const nav = {
  forward: (windowId: string, crumb: Breadcrumb) => {
    // Adds new crumb to nav array
    store.navForward(windowId, crumb)
  },
  back: (windowId: string, steps = 1) => {
    // Removes last crumb from nav array
    store.navBack(windowId, steps)
  },
  update: (windowId: string, crumb: Breadcrumb, navigate: boolean = true) => {
    // Updated last crumb in nav array with new data
    // Replaces last crumb when navigate is false
    // Adds new crumb to nav array when navigate is true
    store.navUpdate(windowId, crumb, navigate)
  },
}

ipcMain.on('nav:forward', (e, windowId: string, crumb: Breadcrumb) => {
  nav.forward(windowId, crumb)
})

ipcMain.on('nav:back', (e, windowId: string, steps = 1) => {
  nav.back(windowId, steps)
})

ipcMain.on('nav:update', (e, windowId: string, crumb: Breadcrumb, navigate: boolean) => {
  nav.update(windowId, crumb, navigate)
})

export default nav
