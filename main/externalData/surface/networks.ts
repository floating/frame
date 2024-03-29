import EventEmitter from 'events'

export interface NetworksEvents {
  updated: (event: { account: string }) => void
}

type TypedEventEmitter<T extends Record<keyof T, (...args: any[]) => void>> = {
  on<K extends keyof T>(event: K, listener: T[K]): void
  emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): boolean
  off<K extends keyof T>(event: K, listener: T[K]): void
  removeListeners: () => void
}

class NetworksEmitter implements TypedEventEmitter<NetworksEvents> {
  private readonly emitter = new EventEmitter()

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
  //TODO: can change to be a record to different services...
  const networks: Record<Address, Record<number, boolean>> = {}

  const has = (account: string, chainId: number) => Boolean(networks[account]?.[chainId])
  const on = emitter.on.bind(emitter)
  const get = (account: string) =>
    Object.entries(networks[account] || {}).reduce((acc, [key, value]) => {
      if (value) acc.push(Number(key))
      return acc
    }, [] as number[])

  const update = (account: string, chainIds: number[]) => {
    const currentNetworks = get(account)
    if (!networks[account]) networks[account] = {}
    const toRemove = currentNetworks.filter((chainId) => !chainIds.includes(chainId))
    const toAdd = chainIds.filter((chainId) => !networks[account][chainId])
    toRemove.forEach((id) => (networks[account][id] = false))
    toAdd.forEach((id) => (networks[account][id] = true))

    if ([...toAdd, ...toRemove].length) {
      emitter.emit('updated', { account })
    }
  }

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
