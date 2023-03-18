let keyboardLayout

if (global?.navigator) {
  navigator.keyboard.getLayoutMap().then((layout) => {
    keyboardLayout = layout
  })

  // TODO: keyboard layoutchange event listener when Electron supports it
  // navigator.keyboard.addEventListener('layoutchange', () => { keyboardLayout = layout })
}

export const getDisplayShortcut = (platform, shortcut) => {
  const isMacOS = platform === 'darwin'
  const shortcutKey = (keyboardLayout?.get(shortcut.shortcutKey) || shortcut.shortcutKey).toUpperCase()
  const modifierKeys = shortcut.modifierKeys
    .map((modifierKey) => keyboardLayout?.get(modifierKey) || modifierKey)
    .map((modifierKey) => {
      if (modifierKey === 'Alt') {
        return isMacOS ? 'Option' : 'Alt'
      }
      if (modifierKey === 'Meta' || modifierKey === 'Super') {
        const keyMap = {
          darwin: 'Command',
          win32: 'Win'
        }
        return keyMap[platform] || 'Meta'
      }
      if (modifierKey === 'CommandOrCtrl') {
        return isMacOS ? 'Command' : 'Ctrl'
      }
      return modifierKey
    })

  return { modifierKeys, shortcutKey }
}

export const getAcceleratorFromShortcut = ({ modifierKeys, shortcutKey }) => {
  const keyMap = {
    Backquote: '`',
    Comma: ',',
    BracketLeft: '[',
    BracketRight: ']',
    Equal: '=',
    Backslash: '\\',
    Forwardslash: '/',
    Minus: '-',
    Plus: '+',
    Period: '.',
    Semicolon: ';',
    Slash: '/',
    Quote: "'",
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
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

  const acceleratorBits = [...modifierKeys, keyMap[shortcutKey] || shortcutKey]

  return acceleratorBits.join('+')
}

export const getShortcutFromKeyEvent = (e) => {
  const modifierKeys = []
  console.log(e)
  if (e.altKey) {
    modifierKeys.push('Alt')
  }
  if (e.ctrlKey) {
    modifierKeys.push('Control')
  }
  if (e.metaKey) {
    modifierKeys.push('Meta')
  }
  if (e.shiftKey) {
    modifierKeys.push('Shift')
  }

  return {
    modifierKeys,
    shortcutKey: e.code
  }
}
