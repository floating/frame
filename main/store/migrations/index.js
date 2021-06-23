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
    return state
  },
  13: state => {
    state.main.colorway = 'dark'
    return state
  },
  14: state => {
    state.main.colorway = 'light'
    return state
  }
}

module.exports = {
  // Apply migrations to current state
  apply: state => {
    Object.keys(migrations).sort().forEach(version => {
      if (state.main._version < version) state = migrations[version](state)
      state.main._version = version
    })
    return state
  },
  // Return version number of latest known migration
  latest: Math.max(...Object.keys(migrations))
}