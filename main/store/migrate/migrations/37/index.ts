import log from 'electron-log'

import { v35StateSchema } from '../35/schema'

import type { v37State } from './schema'

const migrate = (initial: unknown) => {
  try {
    const state = v35StateSchema.parse(initial)
    const summonShortcutEnabled = state.main.shortcuts.altSlash

    const migratedState: v37State = {
      ...state,
      main: {
        ...state.main,
        shortcuts: {
          summon: {
            modifierKeys: ['Alt'],
            shortcutKey: 'Slash',
            enabled: summonShortcutEnabled,
            configuring: false
          }
        }
      }
    }

    return migratedState
  } catch (e) {
    log.error('Migration 37: could not parse state', e)
  }

  return initial
}

export default {
  version: 37,
  migrate
}
