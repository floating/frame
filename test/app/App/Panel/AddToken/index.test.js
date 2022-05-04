/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import Restore from 'react-restore'
import store from '../../../../../main/store'
import link from '../../../../../resources/link'
import AddTokenComponent from '../../../../../app/App/Panel/Notify/AddToken'

jest.mock('../../../../../main/store/persist')
jest.mock('../../../../../resources/link')

const AddToken = Restore.connect(AddTokenComponent, store)
const user = userEvent.setup()

it('should display the expected chain ID', async () => {
  const { getByLabelText } = render(
    <AddToken currentNetworkId={42} />
  )

  const tokenChainIdInput = getByLabelText('Chain ID')
  expect(tokenChainIdInput.value).toEqual('42')
})

it('should generate the expected HTML', async () => {
  const { asFragment } = render(
    <AddToken currentNetworkId={42} />
  )

  expect(asFragment()).toMatchSnapshot()
})

describe('token metadata lookup', () => {
  beforeEach(() => {
    link.invoke.mockImplementation((channel, contractAddress, chainId) => {
      const tokenData = chainId === 1 ? { name: 'Frame Test', symbol: 'FRT', decimals: '18' } : { name: '', symbol: '', decimals: 0 }
      return Promise.resolve(tokenData)
    })
  })

  it('should perform a lookup on a contract address and display the expected token data', async () => {
    const { getByLabelText } = render(
      <AddToken currentNetworkId={1} />
    )

    const contractAddressInput = getByLabelText('Contract Address')
    await user.type(contractAddressInput, '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')

    const tokenNameInput = getByLabelText('Token Name')
    const tokenSymbolInput = getByLabelText('Symbol')
    const tokenDecimalsInput = getByLabelText('Decimals')
    const tokenChainIdInput = getByLabelText('Chain ID')

    await waitFor(() => {
      expect(contractAddressInput.value).toEqual('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
      expect(tokenNameInput.value).toEqual('Frame Test')
      expect(tokenSymbolInput.value).toEqual('FRT')
      expect(tokenDecimalsInput.value).toEqual('18')
      expect(tokenChainIdInput.value).toEqual('1')
    })
  })

  describe('when the chain id is changed', () => {
    it('should perform a lookup and display the expected token data', async () => {
      const { getByLabelText } = render(
        <AddToken currentNetworkId={2} />
      )

      const tokenContractAddressInput = getByLabelText('Contract Address')
      await user.type(tokenContractAddressInput, '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')

      const tokenNameInput = getByLabelText('Token Name')
      const tokenSymbolInput = getByLabelText('Symbol')
      const tokenDecimalsInput = getByLabelText('Decimals')
      const tokenChainIdInput = getByLabelText('Chain ID')

      expect(tokenNameInput.value).toEqual('Token Name')
      expect(tokenSymbolInput.value).toEqual('SYMBOL')
      expect(tokenDecimalsInput.value).toEqual('?')
      expect(tokenChainIdInput.value).toEqual('2')

      await user.type(tokenChainIdInput, '{Backspace}1')
      await waitFor(() => {
        expect(tokenContractAddressInput.value).toEqual('0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0')
        expect(tokenNameInput.value).toEqual('Frame Test')
        expect(tokenSymbolInput.value).toEqual('FRT')
        expect(tokenDecimalsInput.value).toEqual('18')
        expect(tokenChainIdInput.value).toEqual('1')
      })
    })
  })
})
