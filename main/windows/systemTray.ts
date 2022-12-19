import { app, Menu, Tray as ElectronTray } from 'electron'
import path from 'path'
import store from '../store'
import type { Tray } from '.'

const isMacOS = process.platform === 'darwin'
const isWindows = process.platform === 'win32'

type ClickHandlers = { 
  show: () => void
  hide: () => void 
}

export class SystemTray {
  private electronTray: ElectronTray
  private clickHandlers: { show: () => void; hide: () => void }

  constructor(tray: Tray, clickHandlers: ClickHandlers) {
    this.clickHandlers = clickHandlers
    this.electronTray = new ElectronTray(
      path.join(__dirname, isMacOS ? './IconTemplate.png' : './Icon.png')
    )
    this.electronTray.on('click', () => {
      if (isWindows) {
        const clickAction = tray.isVisible() ? 'hide' : 'show'
        this.clickHandlers[clickAction as keyof typeof clickHandlers]()
      }
    })
  }

  setContextMenu(
    type: string,
    displaySummonShortcut: boolean = store('main.shortcuts.altSlash')
  ) {
    const separatorMenuItem = {
      label: 'Frame',
      click: () => {},
      type: 'separator'
    }
    const menuItemLabelMap = {
      hide: 'Dismiss',
      show: 'Summon'
    }
    const label = menuItemLabelMap[type as keyof typeof menuItemLabelMap]
    const actionMenuItem: Electron.MenuItemConstructorOptions = {
      label,
      click: () => this.clickHandlers[type as keyof typeof this.clickHandlers](),
      toolTip: `${label} Frame`
    }
    const quitMenuItem = {
      label: 'Quit',
      click: () => app.quit()  
    }
  
    if (displaySummonShortcut) {
      actionMenuItem.accelerator = 'Alt+/'
      actionMenuItem.registerAccelerator = false
    }
  
    const menu = Menu.buildFromTemplate([actionMenuItem, separatorMenuItem, quitMenuItem])
  
    setTimeout(() => this.electronTray?.setContextMenu(menu), isMacOS ? 0 : 200)
  }

  closeContextMenu() {
    this.electronTray?.closeContextMenu()
  }

  setTitle(title: string) {
    this.electronTray?.setTitle(title)
  }
}
