interface Observer {
  remove: () => void
}

interface Action {
  updates: any[]
}

declare type CallableStore = (...args: any[]) => any

interface Store extends CallableStore {
  observer: (cb: () => void, id?: string) => Observer
  [actionName: string]: (...args: any) => void
  api: {
    feed: (handler: (state: any, actionBatch: Action[]) => any) => void
  }
}

declare module 'react-restore' {
  export function create(state: any, actions: any): Store
}
