import { useRef } from 'react'

const useAutofocus = (autfocus) => {
  const ref = useRef(null)
  autfocus && setTimeout(() => ref.current && ref.current.focus(), 450)

  return [ref]
}

export default useAutofocus
