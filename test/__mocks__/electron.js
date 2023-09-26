import EventEmitter from 'events'

const dataPaths = {
  userData: './test/.userData'
}

const app = new EventEmitter()
app.getVersion = () => '0.1'
app.getName = () => 'frame-test-app'
app.getPath = (key) => dataPaths[key]

const powerMonitor = new EventEmitter()

const setDataPath = (key, path) => (dataPaths[key] = path)

export { app, setDataPath as _setDataPath, powerMonitor }
