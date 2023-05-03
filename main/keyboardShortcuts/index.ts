import { globalShortcut } from 'electron'
import log from 'electron-log'

import type { Shortcut } from '../store/state/types/shortcuts'
import { shortcutKeyMap } from '../../resources/keyboard/mappings'

const registeredAcceleratorMap: Record<string, string> = {}

const getAcceleratorFromShortcut = ({ modifierKeys, shortcutKey }: Shortcut) => {
  const acceleratorBits = [...modifierKeys, shortcutKeyMap[shortcutKey] || shortcutKey]

  return acceleratorBits.join('+')
}

export const unregisterShortcut = (name: string, shortcut: Shortcut) => {
  const accelerator = getAcceleratorFromShortcut(shortcut)
  try {
    // unregister the accelerator for the specified shortcut
    globalShortcut.unregister(accelerator)

    // unregister any existing accelerator with the specified name
    const existingAccelerator = registeredAcceleratorMap[name as keyof typeof registeredAcceleratorMap]
    if (existingAccelerator && existingAccelerator !== accelerator) {
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
  console.log('blah', shortcut)
  const accelerator = getAcceleratorFromShortcut(shortcut)
  const shortcutStr = [...shortcut.modifierKeys, shortcut.shortcutKey].join('+')
  try {
    if (shortcut.enabled && !shortcut.configuring) {
      globalShortcut.register(accelerator, () => shortcutHandler(accelerator))
      log.info(`Accelerator "${accelerator}" registered for shortcut: ${shortcutStr}`)
      registeredAcceleratorMap[name as keyof typeof registeredAcceleratorMap] = accelerator
    }
  } catch (e) {
    log.error(new Error(`Could not set accelerator "${accelerator}" for shortcut: ${shortcutStr}`))
  }
}
