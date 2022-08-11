import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Restore from 'react-restore'
import store from '../../../../../main/store'
import link from '../../../../../resources/link'
import { setupComponent, advanceTimers } from '../../../../componentSetup'
import AddChainComponent from '../../../../../dash/App/Notify/AddChain'

jest.mock('../../../../../main/store/persist')

const AddChain = Restore.connect(AddChainComponent, store)

const requestProps = (chain = {}) => {
  return {
    editMode: false,
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
  it('renders with defaults', () => {
    const { getByLabelText, getByText, getByRole } = render(<AddChain {...requestProps()} />)

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

    const otherLayerButton = getByText('Other', { selector: 'div' })
    expect(otherLayerButton.getAttribute('aria-checked')).toBe('true')

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

  it('does not allow a chain with an existing ID to be created', async () => {
    const props = requestProps({ id: '0x89', name: 'Mainnet' })
    const { user, getByLabelText, getByRole } = setupComponent(<AddChain {...props} />)

    const chainIdInput = getByLabelText('Chain ID')
    await user.clear(chainIdInput)
    await user.type(chainIdInput, '1')

    const submitButton = getByRole('button')
    expect(submitButton.textContent.toLowerCase()).toBe('invalid chain id')
  })
})
