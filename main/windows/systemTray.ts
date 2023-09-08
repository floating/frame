import { app, BrowserWindow, Menu, Tray as ElectronTray } from 'electron'
import path from 'path'
import Accounts from '../accounts'
import { accountSort as byCreation } from '../../resources/domain/account'
import { Shortcut } from '../store/state/types'
import { stringifyShortcut } from '../keyboardShortcuts/index'

const isMacOS = process.platform === 'darwin'

export type SystemTrayEventHandlers = {
  click: () => void
  clickShow: () => void
  clickHide: () => void
}

export class SystemTray {
  private clickHandlers: SystemTrayEventHandlers
  private electronTray?: ElectronTray
  private mainWindow?: BrowserWindow
  private accounts: Account[] = []
  private currentAccountId?: string
  private summonShortcut?: Shortcut

  constructor(clickHandlers: SystemTrayEventHandlers) {
    this.clickHandlers = clickHandlers
  }

  init(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow
    this.mainWindow.on('show', () => {
      // Auto-hide context menu whenever the main window shows
      this.closeContextMenu()
      this.updateContextMenu()
    })
    this.mainWindow.on('hide', () => this.updateContextMenu())

    // Electron Tray can only be instantiated when the app is ready
    this.electronTray = new ElectronTray(path.join(__dirname, isMacOS ? './IconTemplate.png' : './Icon.png'))
    this.electronTray.on('click', this.clickHandlers.click)
    this.updateContextMenu()
  }

  private updateContextMenu() {
    if (!this.mainWindow) {
      // Not initialized yet
      return
    }

    const separatorMenuItem = {
      label: 'Frame',
      click: () => {},
      type: 'separator'
    }

    const [label, eventName]: [string, keyof SystemTrayEventHandlers] = this.mainWindow.isVisible()
      ? ['Dismiss', 'clickHide']
      : ['Summon', 'clickShow']
    const showHideMenuItem: Electron.MenuItemConstructorOptions = {
      label,
      click: this.clickHandlers[eventName],
      toolTip: `${label} Frame`
    }

    const quitMenuItem = {
      label: 'Quit',
      click: () => app.quit()
    }

    if (this.summonShortcut?.enabled) {
      const { accelerator } = stringifyShortcut(this.summonShortcut)
      showHideMenuItem.accelerator = accelerator
      showHideMenuItem.registerAccelerator = false
    }

    const menu = Menu.buildFromTemplate([
      showHideMenuItem,
      separatorMenuItem,
      this.buildAccountsSubMenu(),
      separatorMenuItem,
      quitMenuItem
    ])

    this.electronTray?.setContextMenu(menu)
  }

  private buildAccountsSubMenu(): Electron.MenuItemConstructorOptions {
    const accounts = this.accounts.sort(byCreation)

    const accountMenuItems: Electron.MenuItemConstructorOptions[] = accounts.map((account) => ({
      label: account.name,
      click: () => {
        Accounts.setSigner(account.id, () => {})
      },
      type: 'checkbox',
      checked: account.id === this.currentAccountId
    }))

    return {
      label: 'Account',
      type: 'submenu',
      submenu: accountMenuItems
    }
  }

  private closeContextMenu() {
    this.electronTray?.closeContextMenu()
  }

  setTitle(title: string) {
    this.electronTray?.setTitle(title)
  }

  setAccounts(accounts: Account[]) {
    this.accounts = accounts
    this.updateContextMenu()
  }

  setCurrentAccountId(currentAccountId: string) {
    this.currentAccountId = currentAccountId
    this.updateContextMenu()
  }

  setSummonShortcut(shortcut: Shortcut) {
    this.summonShortcut = shortcut
    this.updateContextMenu()
  }
}
