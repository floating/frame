import { createContext, useContext, useState, useEffect } from 'react'

export const StoreContext = createContext(null)

const useStore = (...args) => {
  const store = useContext(StoreContext)
  const [value, setValue] = useState(store(...args))

  useEffect(() => {
    const obs = store.observer(() => setValue(store(...args)))
    return () => obs.remove()
  }, [args])

  return value
}

export default useStore
