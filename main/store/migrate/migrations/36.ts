import type { Connection, State } from '../../state'

type LegacyConnection = Omit<Connection, 'current'> & {
  current: Connection['current'] | 'poa'
}

export default function (initial: State) {
  // remove Gnosis chain preset
  const removePoaConnection = (connection: LegacyConnection) => {
    const isPoa = connection.current === 'poa'

    return {
      ...connection,
      current: isPoa ? 'custom' : connection.current,
      custom: isPoa ? 'https://rpc.gnosischain.com' : connection.custom
    }
  }

  const gnosis = initial.main.networks.ethereum[100]

  if (gnosis) {
    initial.main.networks.ethereum[100] = {
      ...gnosis,
      connection: {
        primary: removePoaConnection(gnosis.connection.primary as LegacyConnection) as Connection,
        secondary: removePoaConnection(gnosis.connection.secondary as LegacyConnection) as Connection
      }
    }
  }

  return initial
}
