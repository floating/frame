import { app, Menu } from 'electron'
import store from '../store'

export const createContextMenu = (
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
    click: clickHandlers[type as keyof typeof clickHandlers],
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

  return Menu.buildFromTemplate([actionMenuItem, separatorMenuItem, quitMenuItem])
}
