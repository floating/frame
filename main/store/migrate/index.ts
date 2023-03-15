import log from 'electron-log'

import legacyMigrations from './migrations/legacy'
import migration35 from './migrations/35'
import migration36 from './migrations/36'

import type { Migration, State } from '../state'

// const migrations: Record<number, Migration> = {
//   ...legacyMigrations,
//   ...Object.fromEntries([
//     [35, migration35],
//     [36, migration36]
//   ])
// }

const migrations = [migration35].sort((m1: Migration<any>, m2: Migration<any>) => m1.version - m2.version)

// Version number of latest known migration
const latest = migrations[migrations.length - 1].version

export default {
  // Apply migrations to current state
  apply: (state: State, migrateToVersion = latest) => {
    state.main._version = state.main._version || 0

    migrations.forEach(({ version, generateMigration }) => {
      if (state.main._version < version && version <= migrateToVersion) {
        log.info(`Applying state migration: ${version}`)

        const { validate, migrate } = generateMigration(state)

        const stateToMigrate = validate()
        state = migrate(stateToMigrate)
        state.main._version = version
      }
    })

    return state
  },
  latest
}
