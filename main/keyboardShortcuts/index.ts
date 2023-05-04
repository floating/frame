import { globalShortcut } from 'electron'
import log from 'electron-log'

import store from '../store'
import { shortcutKeyMap } from '../../resources/keyboard/mappings'
import type { Shortcut } from '../store/state/types/shortcuts'

const getAcceleratorFromShortcut = ({ modifierKeys, shortcutKey }: Shortcut) => {
  const acceleratorBits = [...modifierKeys.slice().sort(), shortcutKeyMap[shortcutKey] || shortcutKey]

  return acceleratorBits.join('+')
}

const equivalentShortcuts = (shortcut1: Shortcut, shortcut2: Shortcut) =>
  shortcut1.modifierKeys === shortcut2.modifierKeys && shortcut1.shortcutKey === shortcut2.shortcutKey

function unregister(shortcut: Shortcut) {
  const accelerator = getAcceleratorFromShortcut(shortcut)
  try {
    globalShortcut.unregister(accelerator)
  } catch (e) {
    const shortcutStr = [...shortcut.modifierKeys, shortcut.shortcutKey].join('+')
    log.error(new Error(`Could not unregister accelerator "${accelerator}" for shortcut: ${shortcutStr}`))
  }
}

function register(shortcut: Shortcut, shortcutHandler: (accelerator: string) => void) {
  const accelerator = getAcceleratorFromShortcut(shortcut)
  const shortcutStr = [...shortcut.modifierKeys, shortcut.shortcutKey].join('+')
  try {
    if (shortcut.enabled && !shortcut.configuring) {
      globalShortcut.register(accelerator, () => shortcutHandler(accelerator))
      log.info(`Accelerator "${accelerator}" registered for shortcut: ${shortcutStr}`)
    }
  } catch (e) {
    log.error(new Error(`Could not set accelerator "${accelerator}" for shortcut: ${shortcutStr}`))
  }
}

export const registerShortcut = (shortcut: Shortcut, shortcutHandler: (accelerator: string) => void) => {
  const isWindows = process.platform === 'win32'
  const isMacOS = process.platform === 'darwin'
  const keyboardLayout = store('keyboardLayout')
  const createAltGrShortcut = () => {
    // remove AltGr and Alt from modifiers (Linux)
    // remove AltGr, Alt and Control from modifiers (Windows)
    const modifierKeys = shortcut.modifierKeys.filter((modifier) =>
      isWindows ? !modifier.startsWith('Alt') && modifier !== 'Control' : !modifier.startsWith('Alt')
    )

    // return new modifiers depending on OS + rest of shortcut - so that AltGr / Right Alt triggers in the same way as Left Alt
    return {
      ...shortcut,
      modifierKeys: (isWindows
        ? [...modifierKeys, 'Control', 'Alt']
        : [...modifierKeys, 'AltRight']) as typeof shortcut.modifierKeys
    }
  }

  // Windows & Linux Non-US key layout AltGr / Right Alt fix
  if (!isMacOS) {
    const altGrShortcut = createAltGrShortcut()

    // unregister any existing AltGr shortcut - unless it matches the one we are about to register
    if (!keyboardLayout.isUS && !equivalentShortcuts(shortcut, altGrShortcut)) {
      unregister(altGrShortcut)
    }

    if (
      shortcut.modifierKeys.includes('AltGr') ||
      (shortcut.modifierKeys.includes('Alt') && !keyboardLayout.isUS)
    ) {
      // register the AltGr shortcut
      register(altGrShortcut, shortcutHandler)

      // replace AltGr with Alt in the main shortcut
      shortcut = {
        ...shortcut,
        modifierKeys: shortcut.modifierKeys.map((key) => (key === 'AltGr' ? 'Alt' : key))
      }
    }
  }

  // register the shortcut
  unregister(shortcut)
  register(shortcut, shortcutHandler)
}
