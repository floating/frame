// TODO: remove this once implemented
import log from 'electron-log'

// TODO: remove this once implemented
import { v35StateSchema } from '../35/schema'

const migrate = (initial: unknown) => {
  try {
    // TODO: implement parsing and migration
    // const state = v35StateSchema.parse(initial)
    const state = initial as any
    const summonShortcutEnabled = state.main.shortcuts.altSlash
    state.main.shortcuts = {
      summon: {
        modifierKeys: ['Alt'],
        shortcutKey: 'Slash',
        enabled: summonShortcutEnabled
      }
    }
    return state
  } catch (e) {
    log.error('Migration 37: could not parse state', e)
  }

  return initial
}

export default {
  version: 37,
  migrate
}
