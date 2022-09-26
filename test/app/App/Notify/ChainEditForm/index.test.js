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
    const { getByLabelText } = renderForm({ chain: { symbol: 'AVAX' } })

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

  it('renders the provided block explorer', () => {
    const { getByLabelText } = renderForm({ chain: { explorer: 'https://etherscan.io' } })

    const blockExplorerInput = getByLabelText('Block Explorer')
    expect(blockExplorerInput.value).toEqual('https://etherscan.io')
  })

  it('renders the default block explorer text', () => {
    const { getByLabelText } = renderForm()

    const blockExplorerInput = getByLabelText('Block Explorer')
    expect(blockExplorerInput.value).toEqual('Block Explorer')
  })

  it('renders the testnet toggle as "off" by default', () => {
    const { getByLabelText } = renderForm()

    const testnetToggle = getByLabelText('Is Testnet?')
    expect(testnetToggle.getAttribute('aria-checked')).toBe('false')
  })

  it('renders the provided title label', () => {
    const { getByRole } = renderForm({ labels: { title: 'Add New Chain' }})

    const titleSection = getByRole('title')
    expect(titleSection.textContent).toBe('Add New Chain')
  })

  it('renders instructions to fill in data if no chain name has been entered', () => {
    const { getByRole } = renderForm({
      chain: { id: 1 },
      labels: { submit: 'Create Chain' }
    })

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toBe('Fill in Chain')
  })

  it('renders instructions to fill in data if no chain id has been entered', () => {
    const { getByRole } = renderForm({
      chain: { name: 'Bizarro Mainnet' },
      labels: { submit: 'Create Chain' }
    })

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toBe('Fill in Chain')
  })

  it('renders the provided submit button label when the chain is ready to be submitted', () => {
    const { getByRole } = renderValidForm({ labels: { submit: 'Create Chain' }})

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toBe('Create Chain')
  })

  it('renders the submit button with a warning if the submit is invalidated', () => {
    const { getByRole } = renderValidForm({ validateSubmit: () => ({ valid: false, message: 'no submitting in a test!' })})

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toBe('no submitting in a test!')
  })
})

describe('editing', () => {
  it('does not allow an existing chain id to be edited', () => {
    const { queryByLabelText } = renderForm({ existingChain: true })

    const chainIdInput = queryByLabelText('Chain ID', { selector: 'input' })
    expect(chainIdInput).toBeNull()
  })
})

describe('updating fields', () => {
  it('allows the user to mark a chain as a testnet', async () => {
    const { user, getByLabelText } = renderForm()

    const testnetToggle = getByLabelText('Is Testnet?')
    await user.click(testnetToggle)

    expect(testnetToggle.getAttribute('aria-checked')).toBe('true')
  })
})

describe('submitting', () => {
  it('submits the form when the submit button is clicked', async () => {
    const onSubmit = jest.fn()
    const chain = { id: 10, name: 'Optimism' }
    const { user, getByRole } = renderValidForm({ onSubmit, chain })

    await user.click(getByRole('button'))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining(chain))
  })

  it('displays the submitted label after the user clicks submit', async () => {
    const { user, getByRole } = renderValidForm({ labels: { submitted: 'Updating' }})

    await user.click(getByRole('button'))

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toEqual('Updating')
  })

  it('does not allow a submission if the form is missing chain data', async () => {
    const onSubmit = jest.fn()
    const { user, getByRole } = renderForm({ onSubmit })

    await user.click(getByRole('button'))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not allow a submission if the submit button is invalidated', async () => {
    const onSubmit = jest.fn()
    const { user, getByRole } = renderValidForm({ validateSubmit: () => ({ valid: false, message: 'test' }), onSubmit })

    await user.click(getByRole('button'))

    expect(onSubmit).not.toHaveBeenCalled()
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

function renderForm ({ chain = { }, labels = {}, existingChain, onSubmit = () => {}, validateSubmit = () => ({ valid: true }) } = {}) {
  const props = { chain, labels, existingChain, onSubmit, validateSubmit }
  
  return setupComponent(<ChainEditForm {...props} />)
}
