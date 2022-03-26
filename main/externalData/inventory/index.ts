import log from 'electron-log'
import Pylon from '@framelabs/pylon-client'

export default function inventory (pylon: Pylon, store: Store) {
  function handleUpdates (updates: any[]) {
    if (updates.length === 0) return

    log.verbose(`got inventory updates for ${updates.map(u => u.id)}`)

    updates.forEach(update => {
      store.setInventory(update.id, update.data.inventory)
    })
  }

  function start () {
    pylon.on('inventories', handleUpdates)
  }

  function stop () {
    pylon.inventories([])
    pylon.off('inventories', handleUpdates)
  }

  function setAddresses (addresses: Address[]) {
    log.verbose(`inventory.setAddresses(${addresses})`)
    pylon.inventories(addresses)
  }

  return {
    start, stop, setAddresses
  }
}
