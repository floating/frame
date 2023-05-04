import { globalShortcut } from 'electron'
import log from 'electron-log'

import store from '../store'
import { shortcutKeyMap } from '../../resources/keyboard/mappings'
import type { Shortcut } from '../store/state/types/shortcuts'

const stringifyShortcut = ({ modifierKeys, shortcutKey }: Shortcut) => ({
  shortcutString: [...modifierKeys, shortcutKey].join('+'),
  accelerator: [...modifierKeys.slice().sort(), shortcutKeyMap[shortcutKey] || shortcutKey].join('+')
})

const equivalentShortcuts = (shortcut1: Shortcut, shortcut2: Shortcut) =>
  shortcut1.modifierKeys === shortcut2.modifierKeys && shortcut1.shortcutKey === shortcut2.shortcutKey

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
        : [...modifierKeys, 'AltGr']) as typeof shortcut.modifierKeys
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
