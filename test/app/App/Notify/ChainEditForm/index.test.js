import React from 'react'

import ChainEditForm from '../../../../../dash/App/Notify/ChainEditForm'
import { setupComponent } from '../../../../componentSetup'

jest.mock('../../../../../resources/link')

beforeAll(() => {
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

describe('rendering', () => {
  it('renders the provided chain name', () => {
    const { getByLabelText } = renderForm({ chain: { name: 'Bizarro Mainnet' } })

    const chainNameInput = getByLabelText('Chain Name')
    expect(chainNameInput.value).toEqual('Bizarro Mainnet')
  })

  it('renders the default chain name text', () => {
    const { getByLabelText } = renderForm()

    const chainNameInput = getByLabelText('Chain Name')
    expect(chainNameInput.value).toEqual('Chain Name')
  })

  it('renders the provided chain symbol', () => {
    const { getByLabelText } = renderForm({ chain: { nativeCurrency: { symbol: 'AVAX' } } })

    const symbolInput = getByLabelText('Native Symbol')
    expect(symbolInput.value).toEqual('AVAX')
  })

  it('renders the default chain symbol text', () => {
    const { getByLabelText } = renderForm()

    const symbolInput = getByLabelText('Native Symbol')
    expect(symbolInput.value).toEqual('Native Symbol')
  })

  it('renders the provided chain id', () => {
    const { getByLabelText } = renderForm({ chain: { id: '137' } })

    const chainIdInput = getByLabelText('Chain ID')
    expect(chainIdInput.value).toEqual('137')
  })

  it('renders the default chain id text', () => {
    const { getByLabelText } = renderForm()

    const chainIdInput = getByLabelText('Chain ID')
    expect(chainIdInput.value).toEqual('Chain ID')
  })
  
  it('does not allow an existing chain id to be edited', () => {
    const { queryByLabelText } = renderForm({ existingChain: true })

    const chainIdInput = queryByLabelText('Chain ID', { selector: 'input' })
    expect(chainIdInput).toBeNull()
  })

  it('renders the provided block explorer', () => {
    const { getByLabelText } = renderForm({ chain: { blockExplorerUrls: ['https://etherscan.io'] } })

    const blockExplorerInput = getByLabelText('Block Explorer')
    expect(blockExplorerInput.value).toEqual('https://etherscan.io')
  })

  it('renders the default block explorer text', () => {
    const { getByLabelText } = renderForm()

    const blockExplorerInput = getByLabelText('Block Explorer')
    expect(blockExplorerInput.value).toEqual('Block Explorer')
  })

  it('renders the first provided RPC as the primary RPC', () => {
    const { getByLabelText } = renderForm({ chain: { rpcUrls: ['https://myrpc.polygon.net'] } })

    const primaryRpcInput = getByLabelText('Primary RPC')
    expect(primaryRpcInput.value).toEqual('https://myrpc.polygon.net')
  })

  it('renders the default primary RPC text', () => {
    const { getByLabelText } = renderForm()

    const primaryRpcInput = getByLabelText('Primary RPC')
    expect(primaryRpcInput.value).toEqual('Primary Endpoint')
  })

  it('renders the second provided RPC as the secondary RPC', () => {
    const { getByLabelText } = renderForm({ chain: { rpcUrls: ['https://disconnected.com', 'https://myrpc.polygon.net'] } })

    const secondaryRpcInput = getByLabelText('Secondary RPC')
    expect(secondaryRpcInput.value).toEqual('https://myrpc.polygon.net')
  })

  it('renders the default secondary RPC text', () => {
    const { getByLabelText } = renderForm()

    const secondaryRpcInput = getByLabelText('Secondary RPC')
    expect(secondaryRpcInput.value).toEqual('Secondary Endpoint')
  })

  it('renders the correct button for the provided layer', () => {
    const { getByRole } = renderForm({ chain: { layer: 'testnet' }})

    const otherLayerButton = getByRole('radio', { checked: true })
    expect(otherLayerButton.textContent).toBe('Testnet')
  })

  it('renders the "other" layer button by default', () => {
    const { getByRole } = renderForm()

    const otherLayerButton = getByRole('radio', { checked: true })
    expect(otherLayerButton.textContent).toBe('Other')
  })

  it('renders the provided title label', () => {
    const { getByRole } = renderForm({ labels: { title: 'Add New Chain' }})

    const titleSection = getByRole('title')
    expect(titleSection.textContent).toBe('Add New Chain')
  })

  it('renders a warning to fill in data if the chain is not ready to be submitted', () => {
    const { getByRole } = renderForm({ labels: { submit: 'Create Chain' }})

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toBe('Fill in Chain')
  })

  it('renders the provided submit button label when the chain is ready to be submitted', () => {
    const { getByRole } = renderValidForm({ labels: { submit: 'Create Chain' }})

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toBe('Create Chain')
  })
})

describe('submitting', () => {
  it('does not allow a submission if the form is missing chain data', async () => {
    const onSubmit = jest.fn()
    const { user, getByRole } = renderForm({ onSubmit })

    await user.click(getByRole('button'))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('displays the submitted label after the user clicks submit', async () => {
    const { user, getByRole } = renderValidForm({ labels: { submitted: 'Updating' }})

    await user.click(getByRole('button'))

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toEqual('Updating')
  })

  it('does not allow another submission after the user clicks submit', async () => {
    const onSubmit = jest.fn()
    const { user, getByRole } = renderValidForm({ onSubmit })

    await user.click(getByRole('button'))
    await user.click(getByRole('button'))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})

// helper functions
function renderValidForm (props) {
  return renderForm({ chain: { id: 137, name: 'Polygon' }, ...props})
}

function renderForm ({ chain = { }, labels = {}, existingChain, onSubmit = () => {}, invalidateSubmit = () => {} } = {}) {
  const props = { chain, labels, existingChain, onSubmit, invalidateSubmit }
  
  return setupComponent(<ChainEditForm {...props} />)
}
