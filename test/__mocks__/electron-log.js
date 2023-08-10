function createLogLevel() {
  return process.env.NODE_ENV === 'development' ? console.log : jest.fn()
}

const debug = createLogLevel()
const verbose = createLogLevel()
const info = createLogLevel()
const warn = createLogLevel()
const error = createLogLevel()

const transports = {
  console: {
    level: false
  },
  file: {
    level: false
  }
}

module.exports = { debug, verbose, info, warn, error, transports }
export default { debug, verbose, info, warn, error, transports }
