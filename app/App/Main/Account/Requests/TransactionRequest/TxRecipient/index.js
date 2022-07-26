import React from 'react'
import Restore from 'react-restore'
import { getAddress } from '@ethersproject/address'

import link from '../../../../../../../resources/link'
import svg from '../../../../../../../resources/svg'

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
    const address = req.data.to ? getAddress(req.data.to) : ''
    const ensName = (req.recipient && req.recipient.length < 25) ? req.recipient : ''

    return (
      <div className='_txMain' style={{ animationDelay: (0.1 * this.props.i) + 's' }}>
        <div className='_txMainInner'>
          <div className='_txLabel'>
            Recipient
          </div>
          <div className='_txMainValues'>
            {address ? (
              <div className='_txMainValue'>
                {ensName
                  ? <span className='_txRecipient'>{ensName}</span>
                  : <span className='_txRecipient'>{address.substring(0, 6)}{svg.octicon('kebab-horizontal', { height: 15 })}{address.substring(address.length - 4)}</span>
                }
                {/* {req.decodedData && req.decodedData.contractName ? ( 
                  <span className={'_txDataValueMethod'}>{(() => {
                    if (req.decodedData.contractName.length > 11) return `${req.decodedData.contractName.substr(0, 9)}..`
                    return req.decodedData.contractName
                  })()}</span>
                ) : null} */}
                <div className='_txRecipientFull' onClick={() => {
                  this.copyAddress(address)
                }}>
                  {this.state.copied ? (
                    <span>{'Address Copied'}</span>
                  ) : (
                    <span className='_txRecipientFira'>{address}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className='_txRecipientSlice _txRecipientValue'>
                Deploying Contract
              </div>
            )}
            {req.decodedData && req.decodedData.contractName ? (
              <div className='_txMainTag'>
                {`${req.decodedData.contractName} contract on mainnet`}
              </div>
            ) : (
              <div className='_txMainTag'>
                {'external account on mainnet'}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
}

{/* <div className='transactionToAddressFull' onMouseDown={this.copyAddress.bind(this, req.data.to)}>
{this.state.copied ? <span>{'Copied'}{svg.octicon('clippy', { height: 14 })}</span> : req.data.to}
</div> */}

export default Restore.connect(TxRecipient)
