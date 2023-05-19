import EventEmitter from 'events'

const dataPaths = {
  userData: './test/.userData'
}

const app = {
  getVersion: () => '0.1',
  getName: () => 'frame-test-app',
  getPath: (key) => dataPaths[key]
}

const setDataPath = (key, path) => (dataPaths[key] = path)

const powerMonitor = new EventEmitter()

export { app, setDataPath as _setDataPath, powerMonitor }
