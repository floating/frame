import { globalShortcut } from 'electron'
import log from 'electron-log'

import { getAcceleratorFromShortcut } from '../../resources/keyboard'
import type { Shortcut } from '../store/state/types/shortcuts'

const acceleratorMap = {
  summon: 'Alt+/'
}

export const registerShortcut = (
  name: string,
  shortcut: Shortcut,
  shortcutHandler: (accelerator: string) => void
) => {
  const accelerator = getAcceleratorFromShortcut(shortcut)
  try {
    const existingAccelerator = acceleratorMap[name as keyof typeof acceleratorMap]
    globalShortcut.unregister(accelerator)
    if (existingAccelerator) {
      globalShortcut.unregister(existingAccelerator)
    }
    if (shortcut.enabled && !shortcut.configuring) {
      globalShortcut.register(accelerator, () => shortcutHandler(accelerator))
      acceleratorMap[name as keyof typeof acceleratorMap] = accelerator
    }
  } catch (e) {
    const shortcutStr = [...shortcut.modifierKeys, shortcut.shortcutKey].join('+')
    log.error(new Error(`Could not set accelerator "${accelerator}" for shortcut: ${shortcutStr}`))
  }
}
