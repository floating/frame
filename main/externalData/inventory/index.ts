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
  assets: AssetSet[]
}

interface Collection {
  slug: string,
  name: string,
  description: string,
  featured_image_url: string,
  large_image_url: string
}

async function fetchAssets (address: Address, offset: number) {
  const url = `https://api.opensea.io/api/v1/assets?owner=${address}&order_direction=desc&offset=${offset}&limit=50`
  const options = {
    method: 'GET',
    headers: {
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36'
    }
  }

  try {
    const res = await fetch(url, options)
    return res.json() as Promise<InventorySet>
  } catch (e) {
    log.warn(`could not fetch assets ${address}`, e)

    return { assets: [] }
  }
}

async function scan (address: Address) {
  const inventory: Record<string, AssetSet> = {}

  async function getSet (address: Address, offset = 0) {
    const set = await fetchAssets(address, offset)
    set.assets.forEach(a => {
      inventory[a.id] = a
    })
    if (set.assets.length === 50) await getSet(address, offset + 50)
  }
  
  await getSet(address)
  return inventory
}

export default async function (address: Address) {
  let i = await scan(address)
  const inventory: Record<string, any> = {}
  let a = Object.keys(i).forEach(a => {
    const { collection } = i[a]
    if (!inventory[collection.slug]) {
      inventory[collection.slug] = {
        meta: {
          name: collection.name,
          description: collection.description,
          img: collection.featured_image_url,
          imgLarge: collection.large_image_url
        },
        assets: {}
      }
    }
    const { name, id, token_id, image_url, description, external_link, permalink, traits, asset_contract } = i[a]
    inventory[collection.slug].assets[id] = { 
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
      },

    }
  })
  return inventory
}
