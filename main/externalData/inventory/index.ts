import log from 'electron-log'
import Pylon from '@framelabs/pylon-client'

export default function inventory(pylon: Pylon, store: Store) {
  function handleUpdates(updates: any[]) {
    if (updates.length === 0) return

    log.debug(`got inventory updates for ${updates.map((u) => u.id)}`)

    updates.forEach((update) => {
      store.setInventory(update.id, update.data.inventory)
    })
  }

  function start() {
    log.verbose('starting inventory updates')

    pylon.on('inventories', handleUpdates)
  }

  function stop() {
    log.verbose('stopping inventory updates')

    pylon.inventories([])
    pylon.off('inventories', handleUpdates)
  }

  function setAddresses(addresses: Address[]) {
    log.verbose('setting addresses for inventory updates', addresses)

    pylon.inventories(addresses)
  }

  return {
    start,
    stop,
    setAddresses,
  }
}
