import log from 'electron-log'
import { z } from 'zod'

import { v37 as LegacyChainSchema, v38 as NewChainSchema } from '../../../state/types/chains'
import { v37 as LegacyMuteSchema, v38 as NewMuteSchema } from '../../../state/types/mute'

const InputSchema = z
  .object({
    main: z
      .object({
        networks: LegacyChainSchema,
        mute: LegacyMuteSchema
      })
      .passthrough()
  })
  .passthrough()

const OutputSchema = z.object({
  main: z.object({
    networks: NewChainSchema,
    mute: NewMuteSchema
  })
})

type v37Chain = z.infer<typeof LegacyChainSchema.shape.ethereum.valueSchema>
type v38Chain = z.infer<typeof NewChainSchema.shape.ethereum.valueSchema>
type v37Connection = v37Chain['connection']['primary']
type v38Connection = v38Chain['connection']['primary']
type OutputState = z.infer<typeof OutputSchema>

const migrate = (initial: unknown) => {
  let showMigrationWarning = false

  const updateChain = (chain: v37Chain) => {
    const removeRpcConnection = (connection: v37Connection) => {
      const isValidConnection = (connection: v37Connection | v38Connection): connection is v38Connection =>
        connection.current !== 'infura' && connection.current !== 'alchemy'

      if (!isValidConnection(connection)) {
        log.info(`Migration 38: removing ${connection.current} preset from chain ${chain.id}`)
        showMigrationWarning = true
      }

      return {
        ...connection,
        current: isValidConnection(connection) ? connection.current : 'custom',
        custom: isValidConnection(connection) ? connection.custom : ''
      }
    }

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

  const state = InputSchema.parse(initial)

  const chainEntries = Object.entries(state.main.networks.ethereum)
  const chains = chainEntries.reduce(
    (chains, [id, chain]) => ({ ...chains, [id]: updateChain(chain) }),
    {} as Record<string, v38Chain>
  )

  const output: OutputState = {
    ...state,
    main: {
      ...state.main,
      networks: {
        ethereum: chains
      },
      mute: {
        ...state.main.mute,
        migrateToPylon: !showMigrationWarning
      }
    }
  }

  return output
}

export default {
  version: 38,
  migrate
}
