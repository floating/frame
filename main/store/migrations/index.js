const migrations = {
  5: state => {
    return state
  },
  6: state => {
    return state
  },
  7: state => {
    return state
  },
  8: state => {
    return state
  },
  9: state => {
    return state
  },
  10: state => {
    return state
  },
  11: state => {
    state.main.colorway = 'light'
    state.main._version = 11
    return state
  },
  12: state => {
    state.main.colorway = 'dark'
    state.main._version = 12
    return state
  },
  13: state => {
    state.main.colorway = 'dark'
    state.main._version = 13
    return state
  }
}

module.exports = {
  // Apply migrations to current state
  apply: state => {
    Object.keys(migrations).sort().forEach(version => {
      if (state.main._version < version) state = migrations[version](state)
    })
    return state
  },
  // Return version number of latest known migration
  latest: () => Math.max(...Object.keys(migrations)) 
}