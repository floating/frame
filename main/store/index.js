const Restore = require('react-restore')
const state = require('./state')
const actions = require('./actions')
const persist = require('./persist')
const store = Restore.create(state(), actions)

store.observer(() => persist.set('main', store('main')))

module.exports = store
