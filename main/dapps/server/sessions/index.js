const sessions = {}

module.exports = {
  add: (hash, session) => {
    sessions[hash] = sessions[hash] || []
    sessions[hash].push(session)
  },
  verify: (hash, session) => {
    return sessions[hash] && sessions[hash].indexOf(session) > -1
  },
  remove: (hash, session) => {
    sessions[hash].splice(sessions[hash].indexOf(session), 1)
    if (sessions[hash].length === 0) delete sessions[hash]
  }
}
