import { useRef } from 'react'

const useConditionalAutofocus = (initialValue, useAutofocus, timeout = 450) => {
  const ref = useRef(initialValue)
  useAutofocus && setTimeout(() => ref.current && ref.current.focus(), timeout)

  return [ref]
}

export default useConditionalAutofocus
