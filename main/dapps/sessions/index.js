const sessions = {}

module.exports = {
  add: (dapp, session) => {
    sessions[dapp] = sessions[dapp] || []
    sessions[dapp].push(session)
  },
  check: (dapp, session) => {
    return sessions[dapp] && sessions[dapp].indexOf(session) > -1
  },
  remove: (dapp) => {
    delete sessions[dapp]
  }
}
