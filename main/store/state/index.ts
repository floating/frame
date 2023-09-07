import log from 'electron-log'

import persist from '../persist'
import migrations from '../migrate'
import StateSchema, { type State } from './schema'
import { queueError } from '../../errors/queue'
import { backupConfig } from '../persist/backup'

const currentVersion = 41
const currentBaseState = { main: { _version: currentVersion } } as State

type PersistedState = {
  main: {
    _version: number
  }
}

type VersionedState = {
  __: Record<number, State>
}

export { currentVersion }
export type { PersistedState }

function loadState() {
  const state = persist.get('main') as Record<string, unknown> | undefined

  if (!state) {
    log.verbose('Persisted state: no state found')
    return currentBaseState
  }

  if (!state.__) {
    log.verbose('Persisted state: legacy state found, returning base state')
    const loadedState = { main: state } as State

    backupConfig(loadedState.main._version, loadedState)

    return loadedState
  }

  const versionedState = state as VersionedState

  const versions = Object.keys(versionedState.__)
    .map((v) => parseInt(v))
    .filter((v) => v <= migrations.latest)
    .sort((a, b) => a - b)

  if (versions.length === 0) {
    log.verbose('Persisted state: no valid state versions found')
    return currentBaseState
  }

  const latest = versions[versions.length - 1]
  log.verbose('Persisted state: returning latest state', { version: latest })

  backupConfig(latest, { main: state })

  return versionedState.__[latest]
}

export default function () {
  // remove nodes that aren't persisted
  const { main } = loadState()

  const migratedState = migrations.apply({ main })
  const result = StateSchema.safeParse(migratedState)

  if (!result.success) {
    // this can only happen if the state is corrupted in an unrecoverable way
    queueError(result.error)

    const issues = result.error.issues
    log.warn(`Found ${issues.length} issues while parsing saved state`, issues)

    const defaultState = StateSchema.safeParse(currentBaseState)

    return defaultState.success && defaultState.data
  }

  return result.data
}
