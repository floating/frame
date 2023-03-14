import type { State } from '../state/types'

export type Migration = (initialState: State) => State
