import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Restore from 'react-restore'
import store from '../../../../../main/store'
import link from '../../../../../resources/link'
import AddTokenComponent from '../../../../../dash/App/Tokens/AddToken'

jest.mock('../../../../../main/store/persist')
jest.mock('../../../../../resources/link')

const AddToken = Restore.connect(AddTokenComponent, store)
const user = userEvent.setup()

it('should display the expected chain ID', async () => {
  const { getByRole } = render(
    <AddToken
      activeChains={[
        { id: 1, name: 'Mainnet', connection: { primary: { connected: true } } },
        { id: 137, name: 'Polygon', connection: { primary: { connected: true } } },
      ]}
    />
  )

  const tokenChainName = getByRole('option', { selected: true }).textContent
  expect(tokenChainName).toEqual('Mainnet')
})

it('should generate the expected HTML', async () => {
  const { asFragment } = render(
    <AddToken
      activeChains={[
        { id: 1, name: 'Mainnet', connection: { primary: { connected: true } } },
        { id: 137, name: 'Polygon', connection: { primary: { connected: true } } },
      ]}
    />
  )

  expect(asFragment()).toMatchSnapshot()
})

describe('token metadata lookup', () => {
  beforeEach(() => {
    link.invoke.mockImplementation((channel, contractAddress, chainId) => {
      const tokenData =
        chainId === 1
          ? { name: 'Frame Test', symbol: 'FRT', decimals: '18' }
          : { name: 'Frame Test on Polygon', symbol: 'mFRT', decimals: '18' }
      return Promise.resolve(tokenData)
    })
  })

  it('should perform a lookup on a contract address and display the expected token data', async () => {
    const { getByLabelText, getByRole } = render(
      <AddToken
        activeChains={[
          { id: 1, name: 'Mainnet', connection: { primary: { connected: true } } },
          { id: 137, name: 'Polygon', connection: { primary: { connected: true } } },
        ]}
      />
    )

    const contractAddressInput = getByLabelText('Contract Address')
    await user.type(contractAddressInput, '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')

    const tokenNameInput = getByLabelText('Token Name')
    const tokenSymbolInput = getByLabelText('Symbol')
    const tokenDecimalsInput = getByLabelText('Decimals')
    const tokenChainSelect = getByRole('option', { selected: true })

    await waitFor(() => {
      expect(contractAddressInput.value).toEqual('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
      expect(tokenNameInput.value).toEqual('Frame Test')
      expect(tokenSymbolInput.value).toEqual('FRT')
      expect(tokenDecimalsInput.value).toEqual('18')
      expect(tokenChainSelect.textContent).toEqual('Mainnet')
    })
  }, 1000)

  describe('when the chain id is changed', () => {
    it('should perform a lookup and display the expected token data', async () => {
      const { getByLabelText, getByRole } = render(
        <AddToken
          activeChains={[
            { id: 1, name: 'Mainnet', connection: { primary: { connected: true } } },
            { id: 137, name: 'Polygon', connection: { primary: { connected: true } } },
          ]}
        />
      )

      const tokenContractAddressInput = getByLabelText('Contract Address')
      await user.type(tokenContractAddressInput, '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')

      const tokenNameInput = getByLabelText('Token Name')
      const tokenSymbolInput = getByLabelText('Symbol')
      const tokenDecimalsInput = getByLabelText('Decimals')
      let tokenChainSelect = getByRole('option', { selected: true })

      expect(tokenChainSelect.textContent).toEqual('Mainnet')

      await userEvent.selectOptions(getByRole('listbox'), getByRole('option', { name: 'Polygon' }))
      tokenChainSelect = getByRole('option', { selected: true })

      await waitFor(() => {
        expect(tokenContractAddressInput.value).toEqual(
          '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0'
        )
        expect(tokenNameInput.value).toEqual('Frame Test on Polygon')
        expect(tokenSymbolInput.value).toEqual('mFRT')
        expect(tokenDecimalsInput.value).toEqual('18')
        expect(tokenChainSelect.textContent).toEqual('Polygon')
      })
    }, 1000)
  })
})
