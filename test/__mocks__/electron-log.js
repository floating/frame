const debug = jest.fn()
const verbose = jest.fn()
const info = jest.fn()
const warn = jest.fn()
const error = jest.fn()

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
