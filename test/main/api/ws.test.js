import WebSocket from 'ws'
import { EventEmitter } from 'stream'

import store from '../../../main/store'
import ws from '../../../main/api/ws'

let socketConnection, mockSocket

const extensionRequest = {
  headers: {
    origin: 'chrome-extension://ldcoohedfbjoobcadoglnnmmfbdlmmhf'
  }
}

jest.mock('ws')
jest.mock('../../../main/store')
jest.mock('../../../main/provider', () => ({ on: jest.fn() }))
jest.mock('../../../main/accounts', () => {})
jest.mock('../../../main/windows', () => {})

beforeEach(() => {
  store.initOrigin = jest.fn()

  socketConnection = new EventEmitter()
  mockSocket = new EventEmitter()
  mockSocket.readyState = WebSocket.OPEN

  WebSocket.Server.mockReturnValueOnce(socketConnection)

  ws()
  socketConnection.emit('connection', mockSocket, extensionRequest)
})

it('always responds to an extension request for chain id with the requested chain id', (done) => {
  const rpcRequest = { id: 9, jsonrpc: '2.0', method: 'eth_chainId', params: [] }

  mockSocket.send = (response) => {
    const responsePayload = JSON.parse(response)
    expect(responsePayload.id).toBe(rpcRequest.id)
    expect(responsePayload.jsonrpc).toBe(rpcRequest.jsonrpc)
    expect(responsePayload.result).toBe('0x1')

    done()
  }

  mockSocket.emit('message', JSON.stringify(rpcRequest))
})

it('always responds to an extension request for net version with the requested chain', (done) => {
  const rpcRequest = { id: 9, jsonrpc: '2.0', method: 'net_version', params: [] }

  mockSocket.send = (response) => {
    const responsePayload = JSON.parse(response)
    expect(responsePayload.id).toBe(rpcRequest.id)
    expect(responsePayload.jsonrpc).toBe(rpcRequest.jsonrpc)
    expect(responsePayload.result).toBe(1)

    done()
  }

  mockSocket.emit('message', JSON.stringify(rpcRequest))
})
