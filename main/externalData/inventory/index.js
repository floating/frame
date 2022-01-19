const fetch = require('node-fetch')

const scan = async (address) => {
  const inventory = {}

  const getSet = async (address, offset) => {
    const url = `https://api.opensea.io/api/v1/assets?owner=${address}&order_direction=desc&offset=${offset}&limit=50`
    const options = {
      method: 'GET',
      headers: {
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36'
      }
    }

    const set = await (await fetch(url, options)).json()
    set.assets.forEach(a => {
      inventory[a.id] = a
    })
    if (set.assets.length === 50) await getSet(address, offset + 50)
  }
  
  await getSet(address, 0)
  return inventory
}

module.exports = async (address) => {
  let i = await scan(address)
  const inventory = {}
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
