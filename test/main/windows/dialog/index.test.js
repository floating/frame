import { app, dialog } from 'electron'
import { showUnhandledExceptionDialog } from '../../../../main/windows/dialog'

jest.mock('electron', () => ({
  dialog: {
    showMessageBoxSync: jest.fn(),
    showErrorBox: jest.fn()
  },
  app: {
    quit: jest.fn(),
    relaunch: jest.fn()
  }
}))

describe('#showUnhandledExceptionDialog', () => {
  it('displays the error message to the user', () => {
    showUnhandledExceptionDialog('something bad happened')

    expect(dialog.showMessageBoxSync).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        detail: 'something bad happened'
      })
    )
  })

  it('gives the user an option to accept the error or quit Frame', () => {
    showUnhandledExceptionDialog('something bad happened')

    expect(dialog.showMessageBoxSync).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({
        buttons: ['OK', 'Quit']
      })
    )
  })

  it('will relaunch the app when the user clicks OK', () => {
    dialog.showMessageBoxSync.mockImplementation(() => 0)

    showUnhandledExceptionDialog('something bad happened')

    expect(app.relaunch).toHaveBeenCalled()
    expect(app.quit).toHaveBeenCalled()
  })

  it('will not relaunch the app when the user clicks quit', () => {
    dialog.showMessageBoxSync.mockImplementation(() => 1)

    showUnhandledExceptionDialog('something bad happened')

    expect(app.relaunch).not.toHaveBeenCalled()
    expect(app.quit).toHaveBeenCalled()
  })

  it('shows a simple error box and quits for an EADDRINUSE error', () => {
    showUnhandledExceptionDialog('Frame is already running', 'EADDRINUSE')

    expect(dialog.showErrorBox).toHaveBeenCalled()
    expect(dialog.showMessageBoxSync).not.toHaveBeenCalled()
    expect(app.relaunch).not.toHaveBeenCalled()
    expect(app.quit).toHaveBeenCalled()
  })
})
