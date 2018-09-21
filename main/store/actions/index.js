module.exports = {
  setSync: (u, key, payload) => u(key, () => payload)
}
