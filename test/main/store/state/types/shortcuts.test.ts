import { latest as ShortcutsSchema } from '../../../../../main/store/state/types/shortcuts'

const defaultShortcutSettings = {
  summon: {
    modifierKeys: ['Alt'],
    shortcutKey: 'Slash',
    enabled: true,
    configuring: false
  }
}

it('uses default settings for an empty state', () => {
  expect(ShortcutsSchema.parse(undefined)).toStrictEqual(defaultShortcutSettings)
})

it('uses default settings for a corrupt state', () => {
  expect(ShortcutsSchema.parse([])).toStrictEqual(defaultShortcutSettings)
})

it('parses existing settings', () => {
  const settings = {
    summon: {
      modifierKeys: ['Super', 'CommandOrCtrl'],
      shortcutKey: 'KeyB',
      enabled: false,
      configuring: false
    }
  }

  expect(ShortcutsSchema.parse(settings)).toStrictEqual(settings)
})
