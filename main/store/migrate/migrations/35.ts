<<<<<<< HEAD
const pylonChainIds = ['1', '5', '10', '137', '42161', '11155111']
const retiredChainIds = ['3', '4', '42']
const chainsToMigrate = [...pylonChainIds, ...retiredChainIds]

export default function (initial: State) {
  // disable all Infura and Alchemy connections; these may later be
  // replaced by connections to Pylon if the user opts in, otherwise they will be left as
  // custom connections to be specified by the user
=======
import { z } from 'zod'

import type { Migration } from '../../state'

const ConnectionSchema = z
  .object({
    current: z.enum(['local', 'custom', 'infura', 'alchemy']),
    on: z.boolean()
  })
  .passthrough()

const ChainSchema = z
  .object({
    connection: z.object({
      primary: ConnectionSchema,
      secondary: ConnectionSchema
    })
  })
  .passthrough()

const ChainEntrySchema = z.tuple([z.coerce.number(), ChainSchema])

type LegacyChain = z.infer<typeof ChainSchema>
type LegacyConnection = z.infer<typeof ConnectionSchema>
>>>>>>> try new migration format

  let showMigrationWarning = false

  const removeRpcConnection = (connection: Connection) => {
    const isServiceRpc = connection.current === 'infura' || connection.current === 'alchemy'

<<<<<<< HEAD
    showMigrationWarning = showMigrationWarning || isServiceRpc
=======
function updateChain(chain: LegacyChain, replaceWithPylon = true) {
  const { primary, secondary } = chain.connection
>>>>>>> try new migration format

    return {
      ...connection,
      current: isServiceRpc ? 'custom' : connection.current,
      custom: isServiceRpc ? '' : connection.custom
    }
  }

  const updateChain = (chain: Network) => {
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

<<<<<<< HEAD
  const chains = Object.entries(initial.main.networks.ethereum)

  const migratedChains = chains
    .filter(([id]) => chainsToMigrate.includes(id))
    .map(([id, chain]) => [id, updateChain(chain)])

  initial.main.networks.ethereum = Object.fromEntries([...chains, ...migratedChains])
  initial.main.mute.migrateToPylon = !showMigrationWarning
=======
const generateMigration = (initial: any) => {
  const validate = () => {
    const chains = Object.entries(initial.main.networks.ethereum)

    // remove any chains that don't match the type expected by the migration
    const validChains = chains
      .filter((entry) => ChainEntrySchema.safeParse(entry).success)
      .map((entry) => ChainEntrySchema.parse(entry))

    return Object.fromEntries(validChains)
  }

  const migrate = (chainObjects: Record<number, LegacyChain>) => {
    const chains = Object.entries(chainObjects)

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
>>>>>>> try new migration format

  return { validate, migrate }
}

const migration: Migration<Record<number, LegacyChain>> = {
  version: 35,
  generateMigration
}

export default migration
