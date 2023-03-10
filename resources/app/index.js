let mappedSlash
navigator.keyboard.getLayoutMap().then((keyboardLayout) => {
  mappedSlash = keyboardLayout.get('Slash')
})

export const getSummonShortcut = (platform) => {
  const modifierKey = platform === 'darwin' ? 'Option' : 'Alt'
  const summonKey = mappedSlash ? mappedSlash : '/'
  return { modifierKey, summonKey }
}
