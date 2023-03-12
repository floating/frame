function removeRpcConnection(connection: Connection) {
  const isServiceRpc = connection.current === 'infura' || connection.current === 'alchemy'

  return {
    ...connection,
    current: isServiceRpc ? 'custom' : connection.current,
    custom: isServiceRpc ? '' : connection.custom
  }
}

function updateChain(chain: Network) {
  const { primary, secondary } = chain.connection

  const updatedChain = {
    ...chain,
    connection: {
      ...chain.connection,
      primary: removeRpcConnection(primary),
      secondary: removeRpcConnection(secondary)
    }
  }

  return updatedChain
}

const pylonChainIds = ['1', '5', '10', '137', '42161', '11155111']
const retiredChainIds = ['3', '4', '42']
const chainsToMigrate = [...pylonChainIds, ...retiredChainIds]

export default function (initial: State) {
  // disable all Infura and Alchemy connections; these may later be
  // replaced by connections to Pylon if the user opts in, otherwise they will be left as
  // custom connections to be specified by the user

  const chains = Object.entries(initial.main.networks.ethereum)

  const migratedChains = chains
    .filter(([id]) => chainsToMigrate.includes(id))
    .map(([id, chain]) => [id, updateChain(chain)])

  initial.main.networks.ethereum = Object.fromEntries([...chains, ...migratedChains])

  return initial
}
