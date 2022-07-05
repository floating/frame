import * as Sentry from '@sentry/electron'
import showUnhandledExceptionDialog from '../windows/dialog/unhandledException'
import type { Event } from '@sentry/types'
import log from 'electron-log'

import store from '../store'

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

export function initSentry () {
  Sentry.init({
    // only use IPC from renderer process, not HTTP
    ipcMode: Sentry.IPCMode.Classic,
    dsn: 'https://7b09a85b26924609bef5882387e2c4dc@o1204372.ingest.sentry.io/6331069',
    beforeSend: (evt: Event) => ({
      ...evt,
      exception: { values: getSentryExceptions(evt) },
      user: { ...evt.user, ip_address: undefined }, // remove IP address
      tags: { ...evt.tags, 'frame.instance_id': store('main.instanceId') },
      extra: getCrashReportFields()
    })
  })
}

// prevent showing the exit dialog more than once
let closing = false

export function uncaughtExceptionHandler (e: NodeJS.ErrnoException) {
  log.error('uncaughtException', e)

  Sentry.captureException(e)

  if (e.code === 'EPIPE') {
    log.error('uncaught EPIPE error', e)
    return
  }

  if (!closing) {
    closing = true

    showUnhandledExceptionDialog(e.message, e.code)
  }
}
