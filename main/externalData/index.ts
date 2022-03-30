import log from 'electron-log'
import Pylon from '@framelabs/pylon-client'

import store from '../store'
import Inventory from './inventory'
import Rates from './assets'
import { arraysMatch, debounce } from '../../resources/utils'
import Balances from './balances'

export interface DataScanner {
  close: () => void
}

const storeApi = {
  getActiveAddress: () => (store('selected.current') || '') as Address,
  getNetworks: () => (Object.values(store('main.networks.ethereum') || {})) as Network[],
  getConnectedNetworks: () => {
    return storeApi.getNetworks()
      .filter(n => (n.connection.primary || {}).connected || (n.connection.secondary || {}).connected)
  }
}

export default function () {
  const pylon = new Pylon('wss://data.pylon.link')

  const inventory = Inventory(pylon, store)
  const rates = Rates(pylon, store)
  const balances = Balances(store)

  let connectedChains: number[] = []

  inventory.start()
  rates.start()
  balances.start()

  const handleNetworkUpdate = debounce(() => {
    log.verbose('updating external data due to network update(s)', { connectedChains })

    rates.updateSubscription(connectedChains)
  }, 500)

  const handleAddressUpdate = debounce((address: Address) => {
    log.verbose('updating external data due to address update(s)', { address })

    balances.setAddress(address)
    inventory.setAddresses([address])
    rates.updateSubscription(connectedChains, address)
  }, 800)

  const allNetworksObserver = store.observer(() => {
    const connectedNetworkIds = storeApi.getConnectedNetworks().map(n => n.id).sort()

    if (!arraysMatch(connectedChains, connectedNetworkIds)) {
      connectedChains = connectedNetworkIds

      handleNetworkUpdate()
    }
  }, 'externalData:networks')

  const activeAddressObserver = store.observer(() => {
    const activeAddress = storeApi.getActiveAddress()

    handleAddressUpdate(activeAddress)
  }, 'externalData:activeAddress')

  return {
    close: () => {
      allNetworksObserver.remove()
      activeAddressObserver.remove()

      inventory.stop()
      rates.stop()
      balances.stop()
    }
  } as DataScanner
}
