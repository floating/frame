// import EventEmitter from 'events'
import Restore from 'react-restore'
import state from '../state'

const actions = {setSync: (u, key, payload) => u(key, () => payload)}
export const store = Restore.create(state(), actions)
export default store
