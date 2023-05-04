import type { Shortcut, ShortcutKey, ModifierKey } from '../../main/store/state/types/shortcuts'
import link from '../link'
import { Platform, metaKeyMap, shortcutKeyMap } from './mappings'

export type KeyboardLayout = {
  get: (key: string) => string
}

// https://www.w3.org/TR/uievents-code/#keyboard-101
const isUSLayout = () => keyboardLayout?.get('Backslash') === '\\'
let keyboardLayout: KeyboardLayout | undefined

if (global?.navigator) {
  navigator.keyboard.getLayoutMap().then((layout) => {
    keyboardLayout = layout
    ;(link as any).send('tray:action', 'setKeyboardLayout', {
      isUS: isUSLayout()
    })
  })

  // TODO: keyboard layoutchange event listener when Electron supports it
  // navigator.keyboard.addEventListener('layoutchange', () => { keyboardLayout = layout })
}

export const isShortcutKey = (keyEvent: KeyboardEvent) => keyEvent.code in shortcutKeyMap

function getModifierKey(key: ModifierKey, platform: Platform) {
  const isMacOS = platform === 'darwin'

  if (key === 'Alt') {
    return isMacOS ? 'Option' : 'Alt'
  }

  if (key === 'AltGr') {
    return 'Alt'
  }

  if (key === 'Control' || key === 'CommandOrCtrl') {
    return isMacOS ? 'Control' : 'Ctrl'
  }

  if (key === 'Meta' || key === 'Super') {
    return metaKeyMap[platform]
  }

  return key
}

export const getDisplayShortcut = (platform: Platform, shortcut: Shortcut) => {
  const key = (keyboardLayout?.get(shortcut.shortcutKey) as ShortcutKey) || shortcut.shortcutKey

  const shortcutKey =
    key.length === 1 && key.charCodeAt(0) >= 65 && key.charCodeAt(0) <= 122 ? key.toLocaleUpperCase() : key
  const modifierKeys = shortcut.modifierKeys.map((key) =>
    getModifierKey((keyboardLayout?.get(key) as ModifierKey) || key, platform)
  )

  return { modifierKeys, shortcutKey }
}

export const getShortcutFromKeyEvent = (e: KeyboardEvent, pressedKeyCodes: number[], platform: Platform) => {
  const isWindows = platform === 'win32'
  const isLinux = platform === 'linux'
  const modifierKeys = []

  // AltGr detection - Windows registers this as Control + Alt
  // we can distinguish between AltGr and Control + Alt by checking the ctrlKey & altKey props
  if (
    !e.altKey &&
    ((!e.ctrlKey && pressedKeyCodes.includes(17) && isWindows) || (pressedKeyCodes.includes(18) && isLinux))
  ) {
    modifierKeys.push('AltGr')
  }
  if (e.altKey) {
    modifierKeys.push('Alt')
  }
  if (e.ctrlKey) {
    modifierKeys.push('Control')
  }
  if (e.metaKey) {
    modifierKeys.push('Meta')
  }

  return {
    modifierKeys,
    shortcutKey: e.code
  }
}
