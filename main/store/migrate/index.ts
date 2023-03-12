import log from 'electron-log'

import legacyMigrations from './migrations/legacy'
import migration35 from './migrations/35'
import migration36 from './migrations/36'

import type { Migration } from './types'

const migrations: Record<number, Migration> = {
  ...legacyMigrations,
  ...Object.fromEntries([
    [35, migration35],
    [36, migration36]
  ])
}

// Version number of latest known migration
const latest = Math.max(...Object.keys(migrations).map((n) => parseInt(n)))

module.exports = {
  // Apply migrations to current state
  apply: (state: State, migrateToVersion = latest) => {
    state.main._version = state.main._version || 0
    Object.keys(migrations)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach((v) => {
        const version = parseInt(v)
        if (state.main._version < version && version <= migrateToVersion) {
          log.info(`Applying state migration: ${version}`)
          state = migrations[version](state)
          state.main._version = version
        }
      })

    return state
  },
  latest
}
