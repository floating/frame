const sessions = {}

const timers = {}

module.exports = {
  add: (app, session) => {
    sessions[app] = sessions[app] || []
    sessions[app].push(session)
  },
  verify: (app, session) => {
    clearTimeout(timers[session])
    return sessions[app] && sessions[app].indexOf(session) > -1
  },
  remove: (app, session) => {
    timers[session] = setTimeout(() => {
      // TODO: TypeError: Cannot read property 'splice' of undefined
      sessions[app].splice(sessions[app].indexOf(session), 1)
      if (sessions[app].length === 0) delete sessions[app]
    }, 60 * 1000)
  }
}
