const create = function () {
  const internal = {
    state: {},
    observers: {}
  }

  const store = function () {
    const path = [...arguments].join('.').split('.')
    return get(internal.state, path)
  }

  function get(obj, path) {
    if (!obj) return obj
    if (path.length === 1) return obj[path[0]]

    return get(obj[path[0]], path.slice(1))
  }

  function set(obj, path, value) {
    if (path.length === 1) {
      return { ...obj, [path[0]]: value }
    }

    obj[path[0]] = set(obj[path[0]] || {}, path.slice(1), value)

    return obj
  }

  store.set = function () {
    const args = [...arguments]
    const path = args
      .slice(0, args.length - 1)
      .join('.')
      .split('.')
    const value = args.slice(-1)[0]

    internal.state = set(internal.state, path, value)
  }

  store.clear = function () {
    internal.state = {}
    internal.observers = []
  }

  store.observer = function (cb, id) {
    const observer = {
      fire: () => {
        cb()
      },
      remove: () => {
        delete internal.observers[id]
      }
    }

    internal.observers[id] = observer

    return observer
  }

  store.getObserver = function (id) {
    return internal.observers[id]
  }

  return store
}

module.exports = create()
export default create()
