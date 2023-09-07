const sessions: Record<string, string[]> = {}
const timers: Record<string, NodeJS.Timeout> = {}

export default {
  add: (app: string, session: string) => {
    app = app.replaceAll('.', '-')
    sessions[app] = sessions[app] || []
    sessions[app].push(session)
  },
  verify: (app: string, session: string) => {
    app = app.replaceAll('.', '-')
    clearTimeout(timers[session])
    return sessions[app] && sessions[app].indexOf(session) > -1
  },
  remove: (app: string, session: string) => {
    app = app.replaceAll('.', '-')
    sessions[app] = sessions[app] || []
    sessions[app].splice(sessions[app].indexOf(session), 1)
    if (sessions[app].length === 0) delete sessions[app]
  }
}
