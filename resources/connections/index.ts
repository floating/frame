const validProtocols = ['ws://', 'wss://', 'http://', 'https://']

export function okProtocol (location: string) {
  if (location === 'injected') return true
  if (location.endsWith('.ipc')) return true

  const validProtocol = validProtocols.find(p => location.startsWith(p))
  if (validProtocol) {
    const target = location.substring(validProtocol.length)

    // dont allow connections back to Frame
    return target &&
      target !== 'localhost:1248' &&
      target !== '127.0.0.1:1248'
  }

  return false
}
