let keyboardLayout
navigator.keyboard.getLayoutMap().then((_keyboardLayout) => {
  keyboardLayout = _keyboardLayout
})

export const getSummonShortcut = (platform) => {
  const modifierKey = platform === 'darwin' ? 'Option' : 'Alt'
  const summonKey = keyboardLayout ? keyboardLayout.get('Slash') : '/'
  return { modifierKey, summonKey }
}
