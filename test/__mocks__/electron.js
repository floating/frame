const dataPaths = {
  userData: './test/.userData'
}

const app = {
  getVersion: () => '0.1',
  getName: () => 'frame-test-app',
  getPath: (key) => dataPaths[key]
}

const setDataPath = (key, path) => (dataPaths[key] = path)

export { app, setDataPath as _setDataPath }
