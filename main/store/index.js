const Restore = require('react-restore')
const actions = require('./actions')
const state = {network: ''}
const store = Restore.create(state, actions)

module.exports = store
