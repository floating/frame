import React from 'react'
import Restore from 'react-restore'
import { screen } from '@testing-library/react'

import store from '../../../../../main/store'
import link from '../../../../../resources/link'
import { user, setupComponent } from '../../../../componentSetup'
import ChainComponent from '../../../../../app/dash/Chains/Chain'

jest.mock('../../../../../main/store/persist')
jest.mock('../../../../../resources/link', () => ({ send: jest.fn() }))

const Chain = Restore.connect(ChainComponent, store)

beforeAll(() => {
  store.removeNetwork({ type: 'ethereum', id: 137 })
})

describe('rendering', () => {
  it('renders the first provided RPC as the primary RPC', () => {
    const chainConfig = { view: 'setup', primaryRpc: 'https://myrpc.polygon.net' }
    setupComponent(<Chain {...chainConfig} />)

    const primaryRpcInput = screen.getByLabelText('Primary RPC')
    expect(primaryRpcInput.value).toEqual('https://myrpc.polygon.net')
  })

  it('renders the default primary RPC text', () => {
    const chainConfig = { view: 'setup' }
    setupComponent(<Chain {...chainConfig} />)

    const primaryRpcInput = screen.getByLabelText('Primary RPC')
    expect(primaryRpcInput.value).toEqual('Primary Endpoint')
  })

  it('renders the second provided RPC as the secondary RPC', () => {
    const chainConfig = { view: 'setup', secondaryRpc: 'https://my-backup-rpc.polygon.net' }
    setupComponent(<Chain {...chainConfig} />)

    const secondaryRpcInput = screen.getByLabelText('Secondary RPC')
    expect(secondaryRpcInput.value).toEqual('https://my-backup-rpc.polygon.net')
  })

  it('renders the default secondary RPC text', () => {
    const chainConfig = { view: 'setup' }
    setupComponent(<Chain {...chainConfig} />)

    const secondaryRpcInput = screen.getByLabelText('Secondary RPC')
    expect(secondaryRpcInput.value).toEqual('Secondary Endpoint')
  })

  it('renders the default chain name', () => {
    const chainConfig = { view: 'setup' }
    setupComponent(<Chain {...chainConfig} />)

    const titleSection = screen.getByRole('chainName')
    expect(titleSection.textContent).toBe('Chain Name')
  })

  it('renders the correct chain name', () => {
    const chainConfig = { view: 'setup', name: 'Polygon' }
    setupComponent(<Chain {...chainConfig} />)

    const titleSection = screen.getByRole('chainName')
    expect(titleSection.textContent).toBe('Polygon')
  })

  it('renders the correct chain id', () => {
    const chainConfig = { view: 'setup', name: 'Polygon', id: 137 }
    setupComponent(<Chain {...chainConfig} />)

    const chainIdInput = screen.getByLabelText('Chain ID')
    expect(chainIdInput.value).toEqual('137')
  })

  it('renders the correct native symbol', () => {
    const chainConfig = { view: 'setup', name: 'Polygon', id: 137, symbol: 'MATIC' }
    setupComponent(<Chain {...chainConfig} />)

    const chainIdInput = screen.getByLabelText('Native Symbol')
    expect(chainIdInput.value).toEqual('MATIC')
  })

  it('renders the submit button text', () => {
    const chainConfig = {
      view: 'setup',
      id: 137,
      name: 'Polygon',
      symbol: 'MATIC',
      primaryRpc: 'https://rpc-mainnet.matic.network',
      secondaryRpc: 'https://polygon-rpc.com'
    }
    setupComponent(<Chain {...chainConfig} />)

    const submitButton = screen.getByRole('button')
    expect(submitButton.textContent).toBe('Add Chain')
  })

  it('renders the correct submit button text when the form is empty', () => {
    const chainConfig = { view: 'setup', id: 137, name: 'Polygon' }
    setupComponent(<Chain {...chainConfig} />)

    const submitButton = screen.getByRole('button')
    expect(submitButton.textContent).toBe('Fill Chain Details')
  })

  it('renders a warning if the entered chain id already exists', () => {
    const chainConfig = { view: 'setup', id: 1, name: 'Mainnet' }
    setupComponent(<Chain {...chainConfig} />)

    const submitButton = screen.getByRole('button')
    expect(submitButton.textContent).toBe('Chain ID Already Exists')
  })

  it('renders the testnet toggle as off by default', () => {
    const chainConfig = { view: 'setup' }
    setupComponent(<Chain {...chainConfig} />)

    const testnetToggle = screen.getByRole('chainTestnet')
    expect(testnetToggle.getAttribute('aria-checked')).toBe('false')
  })
})

describe('submitting', () => {
  it('does not allow submit if the chain id already exists', async () => {
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

    const chainConfig = { id: 1, name: 'Mainnet' }
    setupComponent(<Chain view='setup' {...chainConfig} />)

    await user.click(screen.getByRole('button'))
    expect(link.send).not.toHaveBeenCalled()
  })

  it('adds a valid chain', async () => {
    const chainConfig = {
      id: 42162,
      type: 'ethereum',
      name: 'Arbitrum Rinkeby',
      symbol: 'ETH',
      explorer: 'https://rinkeby.arbiscan.io',
      primaryRpc: 'https://arbitrum-rinkeby.infura.com',
      secondaryRpc: 'https://myrpc.arbrink.net',
      isTestnet: false
    }

    setupComponent(<Chain view='setup' {...chainConfig} />)

    await user.click(screen.getByRole('button'))

    expect(link.send).toHaveBeenNthCalledWith(1, 'tray:addChain', {
      id: 42162,
      name: 'Arbitrum Rinkeby',
      symbol: 'ETH',
      primaryColor: 'accent2',
      explorer: 'https://rinkeby.arbiscan.io',
      type: 'ethereum',
      isTestnet: false,
      primaryRpc: 'https://arbitrum-rinkeby.infura.com',
      secondaryRpc: 'https://myrpc.arbrink.net'
    })
  })

  it('allows the user to change RPCs before submitting', async () => {
    const chainConfig = {
      id: 42162,
      name: 'Arbitrum Rinkeby',
      symbol: 'arETH',
      primaryRpc: 'https://arbitrum-rinkeby.infura.com',
      secondaryRpc: 'https://myrpc.arbrink.net'
    }

    setupComponent(<Chain view='setup' {...chainConfig} />)

    const primaryRpcInput = screen.getByLabelText('Primary RPC')
    await user.clear(primaryRpcInput)
    await user.type(primaryRpcInput, 'https://arbitrum-rpc.mydomain.com')

    const secondaryRpcInput = screen.getByLabelText('Secondary RPC')
    await user.clear(secondaryRpcInput)
    await user.type(secondaryRpcInput, 'https://myrpc-rinkeby.arbitrum.io')

    await user.click(screen.getByRole('button'))

    expect(link.send).toHaveBeenNthCalledWith(
      1,
      'tray:addChain',
      expect.objectContaining({
        primaryRpc: 'https://arbitrum-rpc.mydomain.com',
        secondaryRpc: 'https://myrpc-rinkeby.arbitrum.io'
      })
    )
  })
})

describe('updating fields', () => {
  it('allows the user to mark a chain as a testnet', async () => {
    const chainConfig = { view: 'setup' }
    setupComponent(<Chain {...chainConfig} />)

    const testnetToggle = screen.getByRole('chainTestnet')
    await user.click(testnetToggle)
    expect(testnetToggle.getAttribute('aria-checked')).toBe('true')
  })
})
