import EventEmitter from 'events'

export interface NetworksEvents {
  updated: (chainIds: number[]) => void
}

type TypedEventEmitter<T extends Record<keyof T, (...args: any[]) => void>> = {
  on<K extends keyof T>(event: K, listener: T[K]): void
  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): boolean
  off<K extends keyof T>(event: K, listener: T[K]): void
  removeListeners: () => void
}

class NetworksEmitter implements TypedEventEmitter<NetworksEvents> {
  private emitter: EventEmitter

  constructor() {
    this.emitter = new EventEmitter()
  }

  on<K extends keyof NetworksEvents>(event: K, listener: NetworksEvents[K]): void {
    this.emitter.on(event, listener)
  }

  emit<K extends keyof NetworksEvents>(event: K, ...args: Parameters<NetworksEvents[K]>): boolean {
    return this.emitter.emit(event, ...args)
  }

  off<K extends keyof NetworksEvents>(event: K, listener: NetworksEvents[K]): void {
    this.emitter.off(event, listener)
  }
  removeListeners() {
    this.emitter.removeAllListeners()
  }
}

const Networks = () => {
  const emitter = new NetworksEmitter()
  const networks = new Set<number>()

  const update = (chainIds: number[]) => {
    const currentNetworks = Array.from(networks)
    const toRemove = currentNetworks.filter((chainId) => !chainIds.includes(chainId))
    const toAdd = chainIds.filter((chainId) => !networks.has(chainId))
    toRemove.forEach(networks.delete.bind(networks))
    toAdd.forEach(networks.add.bind(networks))

    emitter.emit('updated', [...toAdd, ...toRemove])
  }

  const has = networks.has.bind(networks)
  const on = emitter.on.bind(emitter)
  const get = () => Array.from(networks)

  const close = () => {
    emitter.removeListeners()
  }

  return {
    update,
    has,
    on,
    get,
    close
  }
}

export default Networks
