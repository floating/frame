import { Account } from '../../surface'

export type InventoryProcessor = ReturnType<typeof InventoryProcessor>

function InventoryProcessor(store: Store) {
  const updateAccount = (account: Account) => {
    //TODO: convert into the type expected by Frame
    const inventory = [] as any[]

    store.setInventory(account.address, inventory)
  }

  return { updateAccount }
}

export default InventoryProcessor
