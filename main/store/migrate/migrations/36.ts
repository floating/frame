export default function (initial: State) {
  // remove Gnosis chain preset
  const removePoaConnection = (connection: Connection) => {
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
        primary: removePoaConnection(gnosis.connection.primary),
        secondary: removePoaConnection(gnosis.connection.secondary)
      }
    }
  }

  return initial
}
