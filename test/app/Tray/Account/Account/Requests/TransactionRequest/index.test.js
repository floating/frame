import React from 'react'
import Restore from 'react-restore'
import { screen } from '@testing-library/dom'

import store from '../../../../../../../main/store'
import { setupComponent } from '../../../../../../componentSetup'
import TxRequestComponent from '../../../../../../../app/tray/Account/Account/Requests/TransactionRequest'

jest.mock('../../../../../../../main/store/persist')
jest.mock('../../../../../../../resources/link', () => ({ rpc: jest.fn() }))

const TxRequest = Restore.connect(TxRequestComponent, store)

const account = '0xDAFEA492D9c6733ae3d56b7Ed1ADB60692c98Bc5'

function addRequest(req) {
  store.updateAccount({
    id: account,
    name: 'Test Account',
    requests: {
      [req.handlerId]: req
    }
  })
}

describe('confirm', () => {
  it('renders a confirming transaction', () => {
    const req = {
      id: 'test-req',
      status: 'confirming',
      data: {
        chainId: '0x89'
      }
    }

    addRequest(req)

    setupComponent(<TxRequest step='confirm' handlerId={req.id} accountId={account} />)
  })

  it.only('renders a transaction with insufficient funds for gas', () => {
    const req = {
      handlerId: 'test-req',
      type: 'transaction',
      status: 'confirming',
      notice: 'insufficient funds for gas',
      recipientType: 'external',
      data: {
        chainId: '0x89'
      }
    }

    addRequest(req)

    const { getByRole } = setupComponent(
      <TxRequest
        key={req.handlerId}
        req={req}
        step={'confirm'}
        handlerId={req.handlerId}
        accountId={account}
      />
    )

    const notice = getByRole('notice')
    expect(notice.textContent).toMatch(/insufficient funds for gas/i)
  })
})
