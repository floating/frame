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

interface InventorySet {
  next: string | null,
  previous: string | null,
  assets: AssetSet[]
}

interface Collection {
  slug: string,
  name: string,
  description: string,
  featured_image_url: string,
  large_image_url: string
}

async function fetchAssets (address: Address, cursor?: string) {
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
      return { assets: [], next: null, previous: null }
    }

    return res.json() as Promise<InventorySet>
  } catch (e) {
    log.warn(`could not fetch assets ${address}`, e)

    return { assets: [], next: null, previous: null }
  }
}

async function loadAssets (address: Address, cursor?: string): Promise<AssetSet[]> {
  const set = await fetchAssets(address, cursor)

  return (set.next && set.next !== cursor)
    ? [...set.assets, ...(await loadAssets(address, set.next))]
    : set.assets
}

export default async function (address: Address) {
  const assets = await loadAssets(address)
  
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

  return inventory
}
