import React from 'react'
import Restore from 'react-restore'
import { ADDRESS_DISPLAY_CHARS } from '../../../../../../../../resources/constants'

import link from '../../../../../../../../resources/link'
import svg from '../../../../../../../../resources/svg'

class TxRecipient extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      copied: false
    }
  }

  copyAddress (data) {
    link.send('tray:clipboardData', data)
    this.setState({ copied: true })
    setTimeout(_ => this.setState({ copied: false }), 1000)
  }

  render () {
    const req = this.props.req
    const address = (req.data && req.data.to) || ''
    const ensName = (req.recipient && req.recipient.length < 25) ? req.recipient : ''

    return (
      <div className='_txRecipient'>
        <div className='_txRecipientInner'>
          <div className='_txRecipientSlice _txRecipientLabel'>
            Recipient
          </div>
          <div className='_txRecipientFull' onClick={() => {
            this.copyAddress(address)
          }}>
            {this.state.copied ? 'Address Copied' : address}
          </div>
          {address ? (
            <div className='_txRecipientSlice _txRecipientValue'>
              {ensName
                ? <span>{ensName}</span>
                : <span>{address.substring(0, 8)}{svg.octicon('kebab-horizontal', { height: 15 })}{address.substring(address.length - 6)}</span>
              }
              {req.decodedData && req.decodedData.contractName ? (
                <span className={'_txRecipientContract'}>{(() => {
                  if (req.decodedData.contractName.length > 11) return `${req.decodedData.contractName.substr(0, 9)}..`
                  return req.decodedData.contractName
                })()}</span>
              ) : null}
            </div>
          ) : (
            <div className='_txRecipientSlice _txRecipientValue'>
              Deploying Contract
            </div>
          )}
        </div>
      </div>
    )
  }
}

{/* <div className='transactionToAddressFull' onMouseDown={this.copyAddress.bind(this, req.data.to)}>
{this.state.copied ? <span>{'Copied'}{svg.octicon('clippy', { height: 14 })}</span> : req.data.to}
</div> */}

export default Restore.connect(TxRecipient)
