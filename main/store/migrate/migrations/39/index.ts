import log from 'electron-log'
import { z } from 'zod'

import { v38 as LegacyChainSchema, v39 as NewChainSchema } from '../../../state/types/chains'

const InputSchema = z
  .object({
    main: z
      .object({
        networks: LegacyChainSchema
      })
      .passthrough()
  })
  .passthrough()

const OutputSchema = z.object({
  main: z.object({
    networks: NewChainSchema
  })
})

type v38Connection = z.infer<
  typeof LegacyChainSchema.shape.ethereum.valueSchema.shape.connection.shape.primary
>
type v39Connection = z.infer<typeof NewChainSchema.shape.ethereum.valueSchema.shape.connection.shape.primary>
type OutputState = z.infer<typeof OutputSchema>

function removePoaConnection(connection: v38Connection) {
  // remove Gnosis chain preset
  const isValidConnection = (connection: v38Connection | v39Connection): connection is v39Connection =>
    connection.current !== 'poa'

  if (!isValidConnection(connection)) {
    log.info('Migration 39: removing POA presets from Gnosis chain')
  }

  return {
    ...connection,
    current: !isValidConnection(connection) ? 'custom' : connection.current,
    custom: !isValidConnection(connection) ? 'https://rpc.gnosischain.com' : connection.custom
  }
}

const migrate = (initial: unknown) => {
  const state = InputSchema.parse(initial)
  const gnosisChainPresent = '100' in state.main.networks.ethereum

  if (gnosisChainPresent) {
    const gnosisChain = state.main.networks.ethereum[100]

    const updatedState: OutputState = {
      ...state,
      main: {
        ...state.main,
        networks: {
          ethereum: {
            ...state.main.networks.ethereum,
            100: {
              ...gnosisChain,
              connection: {
                primary: removePoaConnection(gnosisChain.connection.primary),
                secondary: removePoaConnection(gnosisChain.connection.secondary)
              }
            }
          }
        }
      }
    }

    return updatedState
  }

  return state
}

export default {
  version: 39,
  migrate
}
