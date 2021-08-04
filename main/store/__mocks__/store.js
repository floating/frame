const mockStore = {
  'main.accounts': { }
}

function store (k) {
  return mockStore[k]
}

store.addAccount = (id, account) => mockStore['main.accounts'][id] = account
store.updateAccount = () => {}
store.observer = () => {}

module.exports = store
