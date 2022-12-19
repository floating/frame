import { app, Menu, Tray as ElectronTray } from 'electron'
import path from 'path'
import store from '../store'

let electronTray: ElectronTray

export const setContextMenu = (
  type: string,
  clickHandlers: { show: () => void; hide: () => void },
  displaySummonShortcut: boolean = store('main.shortcuts.altSlash')
) => {
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
    click: () => clickHandlers[type as keyof typeof clickHandlers](),
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

  setTimeout(() => {
    electronTray?.setContextMenu(menu)
  }, 200)
}

export const closeContextMenu = () => electronTray?.closeContextMenu()

export const setTitle = (title: string) => electronTray?.setTitle(title)

export const init = (appWindowToggle: () => void) => {
  electronTray = new ElectronTray(
    path.join(__dirname, process.platform === 'darwin' ? './IconTemplate.png' : './Icon.png')
  )
  electronTray.on('click', () => {
    if (process.platform === 'win32') {
      appWindowToggle()
    }
  })
}
