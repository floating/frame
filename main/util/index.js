const { app } = require('electron')

const userData = app ? app.getPath('userData') : './test/.userData'
const windows = app ? require('../windows') : { broadcast: () => {} }

module.exports = { userData, windows }
