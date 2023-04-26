type HexAmount = string

type InventoryAsset = {
  name: string
  [field: string]: any
}

type InventoryCollection = {
  meta: any
  items: Record<string, InventoryAsset>
}

type Inventory = Record<string, InventoryCollection>

interface ViewMetadata {
  id: string
  ready: boolean
  dappId: string
  ens: string
  url: string
}

interface Frame {
  id: string
  currentView: string
  views: Record<string, ViewMetadata>
}

interface Signer {
  id: string
  name: string
  model: string
  type: SignerType
  addresses: Address[]
  status: string
  createdAt: number
}
