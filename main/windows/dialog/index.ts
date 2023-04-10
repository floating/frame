import { BrowserWindow, app, dialog } from 'electron'
import windows from '../'

enum ExitAction {
  OK,
  Quit
}

export const showUnhandledExceptionDialog = (message: string, code?: string) => {
  let exitAction = ExitAction.Quit

  if (code === 'EADDRINUSE') {
    dialog.showErrorBox(
      'Frame is already running',
      'Frame is already running or another application is using port 1248.'
    )
  } else {
    exitAction = dialog.showMessageBoxSync(undefined as unknown as BrowserWindow, {
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

export const openFileDialog = async () => {
  const browserWindow = BrowserWindow.getFocusedWindow() as BrowserWindow
  const file = await dialog.showOpenDialog(browserWindow, { properties: ['openFile'] })
  return file
}
