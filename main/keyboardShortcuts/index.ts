import { globalShortcut } from 'electron'
import log from 'electron-log'

import { shortcutKeyMap } from '../../resources/keyboard/mappings'
import type { Shortcut } from '../store/state/types/shortcuts'

function unregister(shortcut: Shortcut) {
  const { shortcutString, accelerator } = stringifyShortcut(shortcut)

  log.verbose(`Unregistering accelerator "${accelerator}" for shortcut: ${shortcutString}`)

  try {
    globalShortcut.unregister(accelerator)
  } catch (e) {
    log.error(`Failed to unregister accelerator "${accelerator}" for shortcut: ${shortcutString}`, e)
  }
}

function register(shortcut: Shortcut, shortcutHandler: (accelerator: string) => void) {
  const { shortcutString, accelerator } = stringifyShortcut(shortcut)

  log.verbose(`Registering accelerator "${accelerator}" for shortcut: ${shortcutString}`)

  try {
    if (shortcut.enabled && !shortcut.configuring) {
      globalShortcut.register(accelerator, () => shortcutHandler(accelerator))
      log.info(`Accelerator "${accelerator}" registered for shortcut: ${shortcutString}`)
    }
  } catch (e) {
    log.error(`Failed to register accelerator "${accelerator}" for shortcut: ${shortcutString}`, e)
  }
}

export const stringifyShortcut = ({ modifierKeys, shortcutKey }: Shortcut) => ({
  shortcutString: [...modifierKeys, shortcutKey].join('+'),
  accelerator: [...modifierKeys.slice().sort(), shortcutKeyMap[shortcutKey] || shortcutKey].join('+')
})

export const registerShortcut = (shortcut: Shortcut, shortcutHandler: (accelerator: string) => void) => {
  unregister(shortcut)
  register(shortcut, shortcutHandler)
}
