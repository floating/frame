import React from 'react'
import Restore from 'react-restore'
import { render } from '@testing-library/react'

import store from '../../../../../main/store'
import link from '../../../../../resources/link'
import { setupComponent } from '../../../../componentSetup'
import AddChainComponent from '../../../../../dash/App/Notify/AddChain'

jest.mock('../../../../../main/store/persist')
jest.mock('../../../../../resources/link', () => ({ send: jest.fn() }))

const AddChain = Restore.connect(AddChainComponent, store)

const createProps = (editMode, chain = {}) => {
  return {
    editMode,
    req: { chain }
  }
}

beforeAll(() => {
  jest.useFakeTimers()

  store.removeNetwork({ type: 'ethereum', id: 137 })
  store.addNetwork({
    id: 1,
    type: 'ethereum',
    name: 'Mainnet',
    explorer: 'https://etherscan.io',
    symbol: 'ETH',
    on: true,
    connection: {
      primary: { connected: true }
    }
  })
})

afterAll(() => {
  jest.useRealTimers()
})

describe('adding a new chain', () => {
  const requestProps = (chain) => createProps(false, chain)

  it('renders with defaults', () => {
    const { getByLabelText, getByRole } = render(<AddChain {...requestProps()} />)

    const chainNameInput = getByLabelText('Chain Name')
    expect(chainNameInput.value).toEqual('Chain Name')

    const chainIdInput = getByLabelText('Chain ID')
    expect(chainIdInput.value).toEqual('Chain ID')

    const blockExplorerInput = getByLabelText('Block Explorer')
    expect(blockExplorerInput.value).toEqual('Block Explorer')

    const primaryRpcInput = getByLabelText('Primary RPC')
    expect(primaryRpcInput.value).toEqual('Primary Endpoint')

    const secondaryRpcInput = getByLabelText('Secondary RPC')
    expect(secondaryRpcInput.value).toEqual('Secondary Endpoint')

    const otherLayerButton = getByRole('radio', { checked: true })
    expect(otherLayerButton.textContent).toBe('Other')

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toBe('Fill in Chain')
  })

  it('renders with the chain name from an add chain request', () => {
    const props = requestProps({ name: 'Polygon' })
    const { getByLabelText } = render(<AddChain {...props} />)

    const chainNameInput = getByLabelText('Chain Name')
    expect(chainNameInput.value).toEqual('Polygon')
  })

  it('renders with the chain ID from an add chain request', () => {
    const props = requestProps({ id: '0x89' })
    const { getByLabelText } = render(<AddChain {...props} />)

    const chainIdInput = getByLabelText('Chain ID')
    expect(chainIdInput.value).toEqual('137')
  })

  it('renders with the first block explorer from an add chain request', () => {
    const props = requestProps({ blockExplorerUrls: ['https://polygonscan.com'] })
    const { getByLabelText } = render(<AddChain {...props} />)

    const blockExplorerInput = getByLabelText('Block Explorer')
    expect(blockExplorerInput.value).toEqual('https://polygonscan.com')
  })

  it('renders with the first RPC url from an add chain request', () => {
    const props = requestProps({ rpcUrls: ['https://myrpc.polygon.net'] })
    const { getByLabelText } = render(<AddChain {...props} />)

    const primaryRpcInput = getByLabelText('Primary RPC')
    expect(primaryRpcInput.value).toEqual('https://myrpc.polygon.net')
  })

  it('renders with the second RPC url from an add chain request', () => {
    const props = requestProps({ rpcUrls: ['https://disconnected.com', 'https://myrpc.polygon.net'] })
    const { getByLabelText } = render(<AddChain {...props} />)

    const secondaryRpcInput = getByLabelText('Secondary RPC')
    expect(secondaryRpcInput.value).toEqual('https://myrpc.polygon.net')
  })

  it('allows a chain with valid settings to be created', () => {
    const props = requestProps({ id: '0x89', name: 'Polygon' })
    const { getByRole } = render(<AddChain {...props} />)

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toBe('Add Chain')
  })

  it('does not allow a chain with an existing ID to be created', () => {
    const props = requestProps({ id: '0x1', name: 'Bizarro Mainnet' })
    const { getByRole } = render(<AddChain {...props} />)

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toMatch(/chain id already exists/i)
  })

  it('shows that the chain is being created', async () => {
    const props = requestProps({ id: '0xa4b2', name: 'Arbitrum Rinkeby' })
    const { user, getByRole } = setupComponent(<AddChain {...props} />)

    await user.click(getByRole('button'))

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toMatch(/creating/i)
  })

  it('adds a new chain when the user clicks submit', async () => {
    const props = requestProps({
      id: '0xa4b2',
      type: 'ethereum',
      name: 'Arbitrum Rinkeby',
      nativeCurrency: {
        symbol: 'ETH'
      },
      blockExplorerUrls: ['https://rinkeby.arbiscan.io'],
      rpcUrls: ['https://arbitrum-rinkeby.infura.com', 'https://myrpc.arbrink.net'],
      layer: 'sidechain'
    })

    const { user, getByRole } = setupComponent(<AddChain {...props} />)

    await user.click(getByRole('button'))

    expect(link.send).toHaveBeenCalledWith('tray:addChain', {
      id: 42162,
      name: 'Arbitrum Rinkeby',
      symbol: 'ETH',
      explorer: 'https://rinkeby.arbiscan.io',
      type: 'ethereum',
      layer: 'sidechain',
      primaryRpc: 'https://arbitrum-rinkeby.infura.com',
      secondaryRpc: 'https://myrpc.arbrink.net'
    }, props.req)
  })
})

describe('editing a chain', () => {
  const requestProps = (chain) => createProps(true, chain)

  it('allows a chain with an existing chain id to be edited', () => {
    const props = requestProps({ id: '0x1', name: 'Bizarro Mainnet' })
    const { getByRole } = render(<AddChain {...props} />)

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toMatch(/update chain/i)
  })

  it('does not allow the chain id to be edited', () => {
    const props = requestProps({ id: '0x1' })
    const { queryByLabelText } = render(<AddChain {...props} />)

    const chainIdInput = queryByLabelText('Chain ID', { selector: 'input' })
    expect(chainIdInput).toBeNull()
  })

  it('does not allow a chain to be edited to have no name', () => {
    const props = requestProps({ id: '0x1', blockExplorerUrls: ['https://etherscan.io'] })
    const { getByRole } = render(<AddChain {...props} />)

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toMatch(/fill in chain/i)
  })

  it('shows that the chain is being updated', async () => {
    const props = requestProps({ id: '0x89', name: 'Matic Network', nativeCurrency: { symbol: 'MATIC' } })
    const { user, getByRole } = setupComponent(<AddChain {...props} />)

    await user.click(getByRole('button'))

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toMatch(/updating/i)
  })

  it('edits the existing chain when the user clicks submit', async () => {
    const props = requestProps({
      id: '0x1',
      type: 'ethereum',
      name: 'Mainnet',
      nativeCurrency: {
        symbol: 'ETH'
      },
      blockExplorerUrls: ['https://etherscan.io'],
      rpcUrls: ['http://localhost:8080', 'https://mainnet.infura.com'],
      layer: 'other'
    })

    const { user, getByRole, getByLabelText } = setupComponent(<AddChain {...props} />)

    const primaryRpcInput = getByLabelText('Primary RPC')
    await user.clear(primaryRpcInput)
    await user.type(primaryRpcInput, 'https://my-custom-rpc.net')
    await user.click(getByRole('button'))

    expect(link.send).toHaveBeenCalledWith('tray:action', 'updateNetwork',
      expect.objectContaining({
        id: '0x1',
        name: 'Mainnet',
        symbol: 'ETH'
      }), {
        id: 1,
        name: 'Mainnet',
        symbol: 'ETH',
        explorer: 'https://etherscan.io',
        primaryRpc: 'https://my-custom-rpc.net',
        secondaryRpc: 'https://mainnet.infura.com',
        type: 'ethereum',
        layer: 'other'
      }
    )
  })
})
