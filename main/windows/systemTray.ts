import { app, Menu, Tray as ElectronTray } from 'electron'
import path from 'path'
import { capitalize } from '../../resources/utils'
import store from '../store'

const isMacOS = process.platform === 'darwin'

type SystemTrayEventHandlers = {
  click: () => void
  clickShow: () => void
  clickHide: () => void
}

export class SystemTray {
  private clickHandlers: SystemTrayEventHandlers
  private electronTray?: ElectronTray

  constructor(clickHandlers: SystemTrayEventHandlers) {
    this.clickHandlers = clickHandlers
  }

  init() {
    // Electron Tray can only be instantiated when the app is ready
    this.electronTray = new ElectronTray(path.join(__dirname, isMacOS ? './IconTemplate.png' : './Icon.png'))
    this.electronTray.on('click', this.clickHandlers.click)
  }

  setContextMenu(type: string, displaySummonShortcut: boolean = store('main.shortcuts.altSlash')) {
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
    const eventName = `click${capitalize(type)}`
    const actionMenuItem: Electron.MenuItemConstructorOptions = {
      label,
      click: () => this.clickHandlers[eventName as keyof typeof this.clickHandlers](),
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
