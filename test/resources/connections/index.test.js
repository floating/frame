import { okProtocol, okPort, isInvalidCustomTarget } from '../../../resources/connections'

describe('#okProtocol', () => {
  it('allows an injected provider', () => {
    expect(okProtocol('injected')).toBe(true)
  })

  it('allows an ipc protocol', () => {
    expect(okProtocol('myprovider.ipc')).toBe(true)
  })

  it('allows an http protocol', () => {
    expect(okProtocol('http://127.0.0.1:1234')).toBe(true)
  })

  it('allows an https protocol', () => {
    expect(okProtocol('https://my-provider.rpc.net')).toBe(true)
  })

  it('allows a ws protocol', () => {
    expect(okProtocol('ws://192.178.1.10')).toBe(true)
  })

  it('allows a wss protocol', () => {
    expect(okProtocol('wss://polygonscan.com')).toBe(true)
  })

  it('does not allow a connection to Frame using localhost', () => {
    expect(okProtocol('http://localhost:1248')).toBe(false)
  })

  it('does not allow a connection to Frame using an IP address', () => {
    expect(okProtocol('wss://127.0.0.1:1248')).toBe(false)
  })

  it('does not allow a known protocol with no target', () => {
    expect(okProtocol('wss://')).toBe(false)
  })

  it('does not allow an unknown preset', () => {
    expect(okProtocol('frame')).toBe(false)
  })

  it('does not allow an unknown protocol', () => {
    expect(okProtocol('tcp://127.0.0.1')).toBe(false)
  })

  it('does not allow an empty string', () => {
    expect(okProtocol('')).toBe(false)
  })
})

describe('#okPort', () => {
  it('allows a port in the standard range using an http connection', () => {
    expect(okPort('http://127.0.0.1:1249')).toBe(true)
  })

  it('allows a port in the standard range using an https connection', () => {
    expect(okPort('https://127.0.0.1:62001')).toBe(true)
  })

  it('allows a port in the standard range using a ws connection', () => {
    expect(okPort('ws://127.0.0.1:9102')).toBe(true)
  })

  it('allows a port in the standard range using a wss connection', () => {
    expect(okPort('wss://rpc.com:8000')).toBe(true)
  })

  it('does not allow a port greater than 65535', () => {
    expect(okPort('wss://my-rpc.net:65536')).toBe(false)
  })
})

describe('#isInvalidCustomTarget', () => {
  it('identifies a valid target', () => {
    expect(isInvalidCustomTarget('wss://127.0.0.1:1249')).toBe(false)
  })

  it('identifies a target with an invalid host', () => {
    expect(isInvalidCustomTarget('http://127.0.0.1:1248')).toBe('invalid target')
  })

  it('identifies a target with an invalid port', () => {
    expect(isInvalidCustomTarget('ws://127.0.0.1:75000')).toBe('invalid port')
  })
})
