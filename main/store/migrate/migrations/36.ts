import { z } from 'zod'
import log from 'electron-log'

import type { Migration } from '../../state'

const ConnectionSchema = z
  .object({
    current: z.enum(['local', 'custom', 'infura', 'alchemy', 'poa']),
    custom: z.string()
  })
  .passthrough()

const ChainSchema = z
  .object({
    id: z.literal(100),
    connection: z.object({
      primary: ConnectionSchema,
      secondary: ConnectionSchema
    })
  })
  .passthrough()

type LegacyChain = z.infer<typeof ChainSchema>
type LegacyConnection = z.infer<typeof ConnectionSchema>

function removePoaConnection(connection: LegacyConnection) {
  // remove Gnosis chain preset
  const isPoa = connection.current === 'poa'

  return {
    ...connection,
    current: isPoa ? 'custom' : connection.current,
    custom: isPoa ? 'https://rpc.gnosischain.com' : connection.custom
  }
}

const generateMigration = (initial: any) => {
  const validate = () => {
    const gnosis = initial.main.networks.ethereum[100]

    if (gnosis) {
      const parsed = ChainSchema.safeParse(gnosis)
      if (parsed.success) {
        return parsed.data
      } else {
        log.info('Migration 36: removing invalid Gnosis chain from state')
        delete initial.main.networks.ethereum[100]
      }
    }
  }

  const migrate = (gnosisChain: LegacyChain) => {
    log.info('Migration 36: removing POA presets from Gnosis chain')

    initial.main.networks.ethereum[100] = {
      ...gnosisChain,
      connection: {
        primary: removePoaConnection(gnosisChain.connection.primary),
        secondary: removePoaConnection(gnosisChain.connection.secondary)
      }
    }

    return initial
  }

  return { validate, migrate }
}

export default {
  version: 36,
  generateMigration
} as Migration<LegacyChain>
