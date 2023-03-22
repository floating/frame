import type { Shortcut, ShortcutKey, ModifierKey } from '../../main/store/state/types/shortcuts'

type Platform = 'darwin' | 'win32' | 'linux'

const metaKeyMap: Record<Platform, string> = {
  darwin: 'Command',
  win32: 'Win',
  linux: 'Meta'
}

const shortcutKeyMap: Record<ShortcutKey, string> = {
  Comma: ',',
  Period: '.',
  Forwardslash: '/',
  Slash: '/',
  Tab: 'Tab',
  Space: 'Space',
  Enter: 'Enter',
  Escape: 'Escape',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  F1: 'F1',
  F2: 'F2',
  F3: 'F3',
  F4: 'F4',
  F5: 'F5',
  F6: 'F6',
  F7: 'F7',
  F8: 'F8',
  F9: 'F9',
  F10: 'F10',
  F11: 'F11',
  Digit9: '9',
  Digit8: '8',
  Digit7: '7',
  Digit6: '6',
  Digit5: '5',
  Digit4: '4',
  Digit3: '3',
  Digit2: '2',
  Digit1: '1',
  Digit0: '0',
  KeyA: 'a',
  KeyB: 'b',
  KeyC: 'c',
  KeyD: 'd',
  KeyE: 'e',
  KeyF: 'f',
  KeyG: 'g',
  KeyH: 'h',
  KeyI: 'i',
  KeyJ: 'j',
  KeyK: 'k',
  KeyL: 'l',
  KeyM: 'm',
  KeyN: 'n',
  KeyO: 'o',
  KeyP: 'p',
  KeyQ: 'q',
  KeyR: 'r',
  KeyS: 's',
  KeyT: 't',
  KeyU: 'u',
  KeyV: 'v',
  KeyW: 'w',
  KeyX: 'x',
  KeyY: 'y',
  KeyZ: 'z',
  NumpadDivide: 'numdiv',
  NumpadMultiply: 'nummult',
  NumpadSubtract: 'numsub',
  NumpadAdd: 'numadd',
  NumpadDecimal: 'numdec',
  Numpad9: 'num9',
  Numpad8: 'num8',
  Numpad7: 'num7',
  Numpad6: 'num6',
  Numpad5: 'num5',
  Numpad4: 'num4',
  Numpad3: 'num3',
  Numpad2: 'num2',
  Numpad1: 'num1',
  Numpad0: 'num0'
}

let keyboardLayout: any

if (global?.navigator) {
  // TODO: use correct navigator type here
  // @ts-ignore
  navigator.keyboard.getLayoutMap().then((layout: any) => {
    keyboardLayout = layout
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

  if (key === 'Control') {
    return isMacOS ? 'Control' : 'Ctrl'
  }

  if (key === 'Meta' || key === 'Super') {
    return metaKeyMap[platform]
  }

  if (key === 'CommandOrCtrl') {
    return isMacOS ? 'Command' : 'Ctrl'
  }

  return key
}

export const getDisplayShortcut = (platform: Platform, shortcut: Shortcut) => {
  const shortcutKey = (keyboardLayout?.get(shortcut.shortcutKey) || shortcut.shortcutKey).toUpperCase()
  const modifierKeys = shortcut.modifierKeys.map((key) =>
    getModifierKey(keyboardLayout?.get(key) || key, platform)
  )

  return { modifierKeys, shortcutKey }
}

export const getAcceleratorFromShortcut = ({ modifierKeys, shortcutKey }: Shortcut) => {
  const acceleratorBits = [...modifierKeys, shortcutKeyMap[shortcutKey] || shortcutKey]

  return acceleratorBits.join('+')
}

export const getShortcutFromKeyEvent = (e: KeyboardEvent) => {
  const modifierKeys = []
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
