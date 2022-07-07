import { init as initSentry, captureException, IPCMode } from '@sentry/electron'
import log from 'electron-log'
import type { Event } from '@sentry/types'

import showUnhandledExceptionDialog from '../windows/dialog/unhandledException'
import store from '../store'

const EVENT_RATE_LIMIT = 5

function getCrashReportFields () {
  const fields = ['networks', 'networksMeta', 'tokens']

  return fields.reduce((extra, field) => ({ ...extra, [field]: JSON.stringify(store('main', field) || {}) }), {})
}

function sanitizeStackFrame ({ module = '' }) {
  const matches = /(.+)[\\|\/]frame[\\|\/]resources[\\|\/]app.asar[\\|\/](.+)/.exec(module)
  if (matches && matches[2]) {
    return `{asar}/${matches[2].replaceAll('\\', '/')}`
  }
  return module
}

function getSentryExceptions (event: Event) {
  const exceptions = event?.exception?.values || []
  const safeExceptions = exceptions.map((exception) => {
    const frames = exception?.stacktrace?.frames || []
    const safeFrames = frames.map((frame) => ({ ...frame, module: sanitizeStackFrame(frame) }))
    return { stacktrace: { frames: safeFrames } }
  })
  
  return safeExceptions
}

// prevent showing the exit dialog more than once
let closing = false

export function uncaughtExceptionHandler (e) {
  log.error('uncaughtException', e)

  captureException(e)

  if (e.code === 'EPIPE') {
    log.error('uncaught EPIPE error', e)
    return
  }

  if (!closing) {
    closing = true

    showUnhandledExceptionDialog(e.message, e.code)
  }
}

export function init () {
  let allowedEvents = EVENT_RATE_LIMIT

  setInterval(() => {
    if (allowedEvents < EVENT_RATE_LIMIT) {
      allowedEvents++
    }
  }, 60_000)
  
  initSentry({
    // only use IPC from renderer process, not HTTP
    ipcMode: IPCMode.Classic,
    dsn: 'https://7b09a85b26924609bef5882387e2c4dc@o1204372.ingest.sentry.io/6331069',
    beforeSend: (event: Event) => {
      if (allowedEvents === 0) {
        return null
      }

      allowedEvents--

      return {
        ...event,
        exception: { values: getSentryExceptions(event) },
        user: { ...event.user, ip_address: undefined }, // remove IP address
        tags: { ...event.tags, 'frame.instance_id': store('main.instanceId') },
        extra: getCrashReportFields()
      }
    }
  })
}
