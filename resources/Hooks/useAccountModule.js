import { useRef, useEffect } from 'react'

import link from '../link'

const useAccountModule = (moduleId) => {
  const moduleRef = useRef(null)
  const resizeTimerRef = useRef(null)
  const resizeObserverRef = useRef(null)

  useEffect(() => {
    resizeObserverRef.current = new ResizeObserver(() => {
      clearTimeout(resizeTimerRef.current)
      resizeTimerRef.current = setTimeout(() => {
        if (moduleRef.current) {
          link.send('tray:action', 'updateAccountModule', moduleId, {
            height: moduleRef.current.clientHeight
          })
        }
      }, 100)
    })

    if (resizeObserverRef.current) {
      resizeObserverRef.current.observe(moduleRef.current)
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
    }
  }, [moduleId])

  return [moduleRef]
}

export default useAccountModule
