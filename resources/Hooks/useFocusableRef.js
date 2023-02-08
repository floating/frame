import { useEffect, useRef } from 'react'

const useFocusableRef = (focus) => {
  const ref = useRef(null)

  useEffect(() => {
    const timeout = focus && setTimeout(() => ref.current && ref.current.focus(), 1000)
    return () => {
      timeout && clearTimeout(timeout)
    }
  })

  return ref
}

export default useFocusableRef
