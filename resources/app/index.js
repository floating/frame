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
        return isMacOS ? 'Command' : 'Windows'
      }
      if (modifierKey === 'CommandOrCtrl') {
        return isMacOS ? 'Command' : 'Ctrl'
      }
      return modifierKey
    })

  return { modifierKeys, shortcutKey }
}

export const getAcceleratorFromShortcut = ({ modifierKeys, shortcutKey: unmappedShortcutKey }) => {
  const keyMap = {
    Backquote: '`',
    Comma: ',',
    BracketLeft: '[',
    BracketRight: ']',
    Equal: '=',
    Forwardslash: '/',
    Minus: '-',
    Plus: '+',
    Period: '.',
    Semicolon: ';',
    Slash: '/',
    Quote: "'"
  }
  //   F1 to F24
  // Punctuation like ~, !, @, #, $, etc.
  // Capslock
  // Numlock
  // Scrolllock
  // Backspace
  // Delete
  // Insert
  // Return (or Enter as alias)
  // Home and End
  // PageUp and PageDown
  // Escape (or Esc for short)
  // VolumeUp, VolumeDown and VolumeMute
  // MediaNextTrack, MediaPreviousTrack, MediaStop and MediaPlayPause
  // PrintScreen
  // NumPad Keys

  //     num0 - num9
  //     numdec - decimal key
  //     numadd - numpad + key
  //     numsub - numpad - key
  //     nummult - numpad * key
  //     numdiv - numpad ÷ key
  const shortcutKey = unmappedShortcutKey.replace('Key', '').replace('Digit', '').replace('Arrow', '')
  const acceleratorBits = [...modifierKeys, keyMap[shortcutKey] || shortcutKey]

  return acceleratorBits.join('+')
}

export const getShortcutFromKeyEvent = (e) => {
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
  if (e.shiftKey) {
    modifierKeys.push('Shift')
  }

  return {
    modifierKeys,
    shortcutKey: e.code
  }
}
