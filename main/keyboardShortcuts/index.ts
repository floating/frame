import { globalShortcut } from 'electron'
import log from 'electron-log'

import type { Shortcut } from '../store/state/types/shortcuts'
import { shortcutKeyMap } from '../../resources/keyboard/mappings'

const acceleratorMap = {
  summon: 'Alt+/'
}

const getAcceleratorFromShortcut = ({ modifierKeys, shortcutKey }: Shortcut) => {
  const acceleratorBits = [...modifierKeys, shortcutKeyMap[shortcutKey] || shortcutKey]

  return acceleratorBits.join('+')
}

export const unregisterShortcut = (name: string, shortcut: Shortcut) => {
  const accelerator = getAcceleratorFromShortcut(shortcut)
  try {
    const existingAccelerator = acceleratorMap[name as keyof typeof acceleratorMap]
    globalShortcut.unregister(accelerator)
    if (existingAccelerator) {
      globalShortcut.unregister(existingAccelerator)
    }
  } catch (e) {
    const shortcutStr = [...shortcut.modifierKeys, shortcut.shortcutKey].join('+')
    log.error(new Error(`Could not unregister accelerator "${accelerator}" for shortcut: ${shortcutStr}`))
  }
}

export const registerShortcut = (
  name: string,
  shortcut: Shortcut,
  shortcutHandler: (accelerator: string) => void
) => {
  const accelerator = getAcceleratorFromShortcut(shortcut)
  unregisterShortcut(name, shortcut)
  const shortcutStr = [...shortcut.modifierKeys, shortcut.shortcutKey].join('+')
  try {
    if (shortcut.enabled && !shortcut.configuring) {
      globalShortcut.register(accelerator, () => shortcutHandler(accelerator))
      log.info(`Accelerator "${accelerator}" registered for shortcut: ${shortcutStr}`)
      acceleratorMap[name as keyof typeof acceleratorMap] = accelerator
    }
  } catch (e) {
    log.error(new Error(`Could not set accelerator "${accelerator}" for shortcut: ${shortcutStr}`))
  }
}
