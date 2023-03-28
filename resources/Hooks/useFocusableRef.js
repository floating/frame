import { useEffect, useRef } from 'react'

const useFocusableRef = (focus, delay = 900) => {
  const ref = useRef(null)

  useEffect(() => {
    if (focus) {
      const timeout = setTimeout(() => ref.current && ref.current.focus(), delay)
      return () => clearTimeout(timeout)
    }
  })

  return ref
}

export default useFocusableRef
