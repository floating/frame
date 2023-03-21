import migration from '../../../../../main/store/migrate/migrations/37'
import { createState } from '../setup'

let state

beforeEach(() => {
  state = createState(migration.version - 1)

  state.main.shortcuts.altSlash = true
})

it('should have migration version 37', () => {
  const { version } = migration
  expect(version).toBe(37)
})

it('should update the summon shortcut when enabled', () => {
  const updatedState = migration.migrate(state)
  const { shortcuts } = updatedState.main

  expect(shortcuts).toStrictEqual({
    summon: {
      modifierKeys: ['Alt'],
      shortcutKey: 'Slash',
      enabled: true
    }
  })
})

it('should update the summon shortcut when disabled', () => {
  state.main.shortcuts.altSlash = false
  const updatedState = migration.migrate(state)
  const { shortcuts } = updatedState.main

  expect(shortcuts).toStrictEqual({
    summon: {
      modifierKeys: ['Alt'],
      shortcutKey: 'Slash',
      enabled: false
    }
  })
})
