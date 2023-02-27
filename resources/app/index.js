let mappedSlash

function setKeyboardLayout() {
  navigator.keyboard.getLayoutMap().then((keyboardLayout) => {
    mappedSlash = keyboardLayout.get('Slash')
  })
  navigator.keyboard.lock(['Slash'])
}

// navigator.keyboard.addEventListener('layoutchange', () => setKeyboardLayout())
setKeyboardLayout()

export const getSummonShortcut = (platform) => {
  const modifierKey = platform === 'darwin' ? 'Option' : 'Alt'
  const summonKey = mappedSlash ? mappedSlash : '/'
  return { modifierKey, summonKey }
}
