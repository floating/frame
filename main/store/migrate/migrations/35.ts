function removeRpcConnection(connection: Connection, replaceWithPylon = true) {
  const isServiceRpc = connection.current === 'infura' || connection.current === 'alchemy'

  return {
    ...connection,
    // turn off existing connections to Infura or Alchemy if they're not being replaced by Pylon
    on: connection.on && (!isServiceRpc || replaceWithPylon),
    current: isServiceRpc ? (replaceWithPylon ? 'pylon' : 'custom') : connection.current
  }
}

function updateChain(chain: Network, replaceWithPylon = true) {
  const { primary, secondary } = chain.connection

  const updatedChain = {
    ...chain,
    connection: {
      ...chain.connection,
      primary: removeRpcConnection(primary, replaceWithPylon),
      secondary: removeRpcConnection(secondary, replaceWithPylon)
    }
  }

  return updatedChain
}

export default function (initial: State) {
  const chains = Object.entries(initial.main.networks.ethereum)

  // migrate existing Infura and Alchemy connections to use Pylon where applicable
  const pylonChains = chains
    .filter(([id]) => ['1', '5', '10', '137', '42161', '11155111'].includes(id))
    .map(([id, chain]) => [id, updateChain(chain)])

  // these connections previously used Infura and Alchemy and are not supported by Pylon
  const retiredChains = chains
    .filter(([id]) => ['3', '4', '42'].includes(id))
    .map(([id, chain]) => [id, updateChain(chain, false)])

  initial.main.networks.ethereum = Object.fromEntries([...chains, ...pylonChains, ...retiredChains])

  return initial
}
