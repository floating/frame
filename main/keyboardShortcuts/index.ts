import { globalShortcut } from 'electron'
import log from 'electron-log'

import store from '../store'
import { shortcutKeyMap } from '../../resources/keyboard/mappings'
import type { Shortcut } from '../store/state/types/shortcuts'

const isWindows = process.platform === 'win32'
const isMacOS = process.platform === 'darwin'
const registeredAcceleratorMap: Record<string, string> = {}

const getAcceleratorFromShortcut = ({ modifierKeys, shortcutKey }: Shortcut) => {
  const acceleratorBits = [...modifierKeys.slice().sort(), shortcutKeyMap[shortcutKey] || shortcutKey]

  return acceleratorBits.join('+')
}

export const unregister = (name: string, shortcut: Shortcut) => {
  const accelerator = getAcceleratorFromShortcut(shortcut)
  try {
    // unregister the accelerator for the specified shortcut
    globalShortcut.unregister(accelerator)

    // unregister any existing accelerator with the specified name
    // const existingAccelerator = registeredAcceleratorMap[name as keyof typeof registeredAcceleratorMap]
    // if (existingAccelerator && existingAccelerator !== accelerator) {
    //   globalShortcut.unregister(existingAccelerator)
    // }
  } catch (e) {
    const shortcutStr = [...shortcut.modifierKeys, shortcut.shortcutKey].join('+')
    log.error(new Error(`Could not unregister accelerator "${accelerator}" for shortcut: ${shortcutStr}`))
  }
}

const register = (name: string, shortcut: Shortcut, shortcutHandler: (accelerator: string) => void) => {
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

export const registerShortcut = (
  name: string,
  shortcut: Shortcut,
  shortcutHandler: (accelerator: string) => void
) => {
  const keyboardLayout = store('keyboardLayout')
  const createShortcutNonUS = () => {
    // remove AltGr and Alt from modifiers (Linux)
    // remove AltGr, Alt and Control from modifiers (Windows)
    const modifierKeys = shortcut.modifierKeys.filter((modifier) =>
      isWindows ? !modifier.startsWith('Alt') && modifier !== 'Control' : !modifier.startsWith('Alt')
    )

    // return new modifiers depending on OS + rest of shortcut - so that AltGr / Right Alt triggers summon in the same way as Left Alt
    return {
      ...shortcut,
      modifierKeys: (isWindows
        ? [...modifierKeys, 'Control', 'Alt']
        : [...modifierKeys, 'AltRight']) as typeof shortcut.modifierKeys
    }
  }

  // Windows & Linux Non-US key layout AltGr / Right Alt fix
  if (!isMacOS) {
    const shortcutNonUS = createShortcutNonUS()
    const shortcutNonUSName = `${name}NonUS`

    if (
      shortcut.modifierKeys.includes('AltGr') ||
      (shortcut.modifierKeys.includes('Alt') && !keyboardLayout.isUS)
    ) {
      // register the NonUS shortcut
      unregister(shortcutNonUSName, shortcutNonUS)
      register(shortcutNonUSName, shortcutNonUS, shortcutHandler)

      // replace AltGr with Alt in the main shortcut
      shortcut.modifierKeys = shortcut.modifierKeys.map((key) => (key === 'AltGr' ? 'Alt' : key))
    } else {
      // unregister any existing NonUS shortcut
      unregister(shortcutNonUSName, shortcutNonUS)
    }
  }

  // register the main summon shortcut
  unregister(name, shortcut)
  register(name, shortcut, shortcutHandler)
}
