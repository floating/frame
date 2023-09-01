import { useRef, useEffect } from 'react'
import { EventEmitter } from 'stream'

import link from '../link'

interface Link extends EventEmitter {
  send: (channel: string, ...args: any[]) => void
}

// TODO: type this in link
const appLink = link as Link

const useAccountModule = (moduleId: number) => {
  const moduleRef = useRef<HTMLDivElement>(null)

  let resizeTimer: ReturnType<typeof setTimeout> | undefined

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (moduleRef.current) {
          appLink.send('tray:action', 'updateAccountModule', moduleId, {
            height: moduleRef.current.clientHeight
          })
        }
      }, 100)
    })

    if (moduleRef.current) {
      resizeObserver.observe(moduleRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [moduleId])

  return [moduleRef]
}

export default useAccountModule
