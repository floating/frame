const Restore = require('react-restore')
const state = require('../../state')
const actions = require('./actions')
const store = Restore.create(state(), actions)
module.exports = store
