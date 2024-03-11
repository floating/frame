import log from 'electron-log'

import legacyMigrations from './migrations/legacy'
import migration38 from './migrations/38'
import migration39 from './migrations/39'
import migration40 from './migrations/40'
import migration41 from './migrations/41'
import migration42 from './migrations/42'

import type { Migration } from '../state'

const migrations: Migration[] = [
  ...legacyMigrations,
  migration38,
  migration39,
  migration40,
  migration41,
  migration42
].sort((m1, m2) => m1.version - m2.version)

// Version number of latest known migration
const latest = migrations[migrations.length - 1].version

export default {
  // Apply migrations to current state
  apply: (state: any, migrateToVersion = latest) => {
    state.main._version = state.main._version || 0

    migrations.forEach(({ version, migrate }) => {
      if (state.main._version < version && version <= migrateToVersion) {
        log.info(`Applying state migration: ${version}`)

        state = migrate(state)
        state.main._version = version
      }
    })

    return state
  },
  latest
}
