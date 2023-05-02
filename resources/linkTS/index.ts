import { v4 } from 'uuid'
import EventEmitter from 'events'

const source = 'tray:link'

const unwrap = (v = '') => (v !== undefined || v !== null ? JSON.parse(v) : v)
const wrap = (v: unknown) => (v !== undefined || v !== null ? JSON.stringify(v) : v)

const handlers: Record<string, (value?: unknown) => void> = {}

interface Link extends EventEmitter {
  rpc: () => void
  send: (channel: string, action: string, params: unknown) => void
  invoke: () => void
}

const link = new EventEmitter() as Link
link.rpc = (...args: (() => void)[]) => {
  const cb = args.pop()
  if (typeof cb !== 'function') throw new Error('link.rpc requires a callback')
  const id = v4()
  handlers[id as keyof typeof handlers] = cb
  window?.postMessage(wrap({ id, args, source, method: 'rpc' }), '*')
}
link.send = (...args) => {
  window?.postMessage(wrap({ args, source, method: 'event' }), '*')
}
link.invoke = (...args) => {
  return new Promise((resolve) => {
    const id = v4()
    handlers[id as keyof typeof handlers] = resolve
    window?.postMessage(wrap({ id, args, source, method: 'invoke' }), '*')
  })
}

const safeOrigins = ['file://'].concat(
  process.env.NODE_ENV === 'development' ? ['http://localhost:1234'] : []
)

if (typeof window !== 'undefined') {
  window?.addEventListener(
    'message',
    (e) => {
      if (!safeOrigins.includes(e.origin) || e.data.source?.includes('react-devtools')) return
      const data = unwrap(e.data)
      const args = data.args || []
      if (data.source !== source) {
        if (data.method === 'rpc') {
          if (!handlers[data.id as keyof typeof handlers])
            return console.log('link.rpc response had no handler')
          handlers[data.id as keyof typeof handlers](...args)
          delete handlers[data.id as keyof typeof handlers]
        } else if (data.method === 'invoke') {
          if (!handlers[data.id as keyof typeof handlers])
            return console.log('link.invoke response had no handler')
          handlers[data.id as keyof typeof handlers](args)
          delete handlers[data.id as keyof typeof handlers]
        } else if (data.method === 'event') {
          if (!data.channel) return console.log('link.on event had no channel')
          link.emit(data.channel, ...args)
        }
      }
    },
    false
  )
}

export default link
