const EventEmitter = require('events')

const cliTools = {
  appendSwitch: jest.fn()
}

const dock = {
  hide: jest.fn()
}

const electronApp = new EventEmitter()
electronApp.commandLine = cliTools
electronApp.dock = dock
electronApp.exit = process.exit
electronApp.quit = process.exit
electronApp.relaunch = jest.fn()

electronApp.getName = () => 'Frame Test App'
electronApp.getVersion = () => '1.0'
electronApp.getPath = () => `${process.cwd()}/test/e2e`
electronApp.requestSingleInstanceLock = jest.fn()

const ipc = new EventEmitter()

module.exports = {
  app: electronApp,
  ipcMain: ipc
}
