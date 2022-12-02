const { app, dialog } = require('electron')

enum ExitAction {
  OK,
  Quit
}

export default function (message: string, code?: string) {
  let exitAction = ExitAction.Quit

  if (code === 'EADDRINUSE') {
    dialog.showErrorBox(
      'Frame is already running',
      'Frame is already running or another application is using port 1248.'
    )
  } else {
    exitAction = dialog.showMessageBoxSync(undefined as any, {
      title: 'Unhandled Exception',
      message: 'An unexpected error occured',
      detail: message,
      type: 'error',
      buttons: Object.keys(ExitAction).slice(Object.keys(ExitAction).length / 2),
      defaultId: ExitAction.OK,
      cancelId: ExitAction.OK
    })
  }

  if (exitAction === ExitAction.OK) {
    app.relaunch()
  }

  app.quit()
}
