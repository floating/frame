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
    const chainName = this.store('main.networks.ethereum', parseInt(req.data.chainId, 16), 'name') 
    const value = req.data.value || '0x'
    if (req.recipientType !== 'contract' && (value !== '0x' || parseInt(value, 16)) !== 0) return null
    return (
      <div className='_txMain' style={{ animationDelay: (0.1 * this.props.i) + 's' }}>
        <div className='_txMainInner'>
          <div className='_txLabel'>
            <div>{req.recipientType === 'contract' ? 'Calling Contract' : 'Recipient Account'}</div>
          </div>
          <div className='_txMainValues'>
            {req.decodedData && req.decodedData.method ? (
              <div className='_txMainValue'>
                <span className={'_txDataValueMethod'}>{(() => {
                  if (req.decodedData.method.length > 17) return `${req.decodedData.method.substr(0, 15)}..`
                  return req.decodedData.method
                })()}</span>
                {/* <span>{'via'}</span>
                <span className={'_txDataValueMethod'}>{(() => {
                  if (req.decodedData.contractName.length > 11) return `${req.decodedData.contractName.substr(0, 9)}..`
                  return req.decodedData.contractName
                })()}</span> */}
              </div>
            ) : req.recipientType === 'contract' ? (
              <div className='_txMainTag'>{'unknown action via unknown contract'}</div>
            ) : null}
            {req.decodedData && req.decodedData.source ? (
              <div className='_txMainTag'>
                {'abi source: ' + req.decodedData.source}
              </div>
            ) : null}
            {address ? (
              <div className='_txMainValue'>
                {ensName
                  ? <span className='_txRecipient'>{ensName}</span>
                  : <span className='_txRecipient'>{address.substring(0, 8)}{svg.octicon('kebab-horizontal', { height: 15 })}{address.substring(address.length - 6)}</span>
                }
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
              <div className='_txMainValue'>
                <span className='_txRecipient'>{'Deploying Contract'}</span>
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
