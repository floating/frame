export function isNetworkConnected (network: Network) {
  return (
    (network.connection.primary && network.connection.primary.connected) ||
    (network.connection.secondary && network.connection.secondary.connected)
  )
}
