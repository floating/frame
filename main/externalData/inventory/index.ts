import fetch from 'node-fetch'
import log from 'electron-log'

interface AssetSet {
  collection: Collection,
  id: string,
  name: string,
  token_id: string,
  image_url: string,
  description: string,
  external_link: string,
  permalink: string,
  traits: string,
  asset_contract: AssetContract
}

interface AssetContract {
  address: string,
  asset_contract_type: string,
  created: string,
  name: string,
  owner: string, 
  schema_name: string,
  description: string,
  image_url: string,
  external_link: string
}

interface AssetResponse {
  next: string | null,
  previous: string | null,
  assets: AssetSet[]
}

interface LoadedAssets extends AssetResponse {
  success: boolean
}

interface Collection {
  slug: string,
  name: string,
  description: string,
  featured_image_url: string,
  large_image_url: string
}

interface InventoryResult {
  success: boolean,
  inventory: Record<string, any>
}

async function fetchAssets (address: Address, cursor?: string): Promise<LoadedAssets> {
  const queryParams = {
    owner: address,
    order_direction: 'desc',
    limit: '50',
    cursor
  }

  const queryStr = Object.entries(queryParams).reduce((params, [key, value]) => {
    if (value) {
      params.push([key, value].join('='))
    }

    return params
  }, [] as string[]).join('&')

  const target = encodeURIComponent(`https://api.opensea.io/api/v1/assets?${queryStr}`)
  const url = `https://proxy.pylon.link?type=api&target=${target}`

  const options = {
    method: 'GET',
    headers: {
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36'
    }
  }

  try {
    const res = await fetch(url, options)

    if (res.status >= 300) {
      const contentType = (res.headers.get('content-type') || '').toLowerCase()
      const errorMsg = contentType.includes('json') ? await res.json() : ''

      log.warn('unable to fetch inventory', errorMsg)
      return { success: false, assets: [], next: null, previous: null }
    }

    const data = (await res.json()) as AssetResponse

    return { ...data, success: true }
  } catch (e) {
    log.warn(`could not fetch assets ${address}`, e)

    return { success: false, assets: [], next: null, previous: null }
  }
}

async function loadAssets (address: Address, cursor?: string): Promise<LoadedAssets> {
  const set = await fetchAssets(address, cursor)
  let nextAssets = { success: true, assets: [] as AssetSet[] }

  if (set.success && set.next && set.next !== cursor) {
    nextAssets = await loadAssets(address, set.next)
  }

  return {
    ...set,
    success: set.success && nextAssets.success,
    assets: [...set.assets, ...nextAssets.assets]
  }
}

export default async function (address: Address): Promise<InventoryResult> {
  const { success, assets } = await loadAssets(address)

  log.debug(`loaded ${assets.length} inventory items, success: ${success}`)
  
  const inventory = assets.reduce((collectedInventory, asset) => {
    const { name, id, token_id, image_url, description, external_link, permalink, traits, asset_contract, collection } = asset

    if (!collectedInventory[collection.slug]) {
      collectedInventory[collection.slug] = {
        meta: {
          name: collection.name,
          description: collection.description,
          img: collection.featured_image_url,
          imgLarge: collection.large_image_url
        },
        assets: {}
      }
    }

    collectedInventory[collection.slug].assets[id] = {
      name, 
      id,
      tokenId: token_id,
      img: image_url, 
      description, 
      link: external_link,
      openSeaLink: permalink,
      traits,
      contract: {
        address: asset_contract.address,
        type: asset_contract.asset_contract_type,
        created: asset_contract.created,
        name: asset_contract.name,
        owner: asset_contract.owner, 
        schema: asset_contract.schema_name,
        description: asset_contract.description,
        img: asset_contract.image_url,
        link: asset_contract.external_link
      }
    }

    return collectedInventory
  }, {} as Record<string, any>)

  return { success, inventory }
}
