import React from 'react'
import Restore from 'react-restore'
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
    const ensName = (req.recipient && req.recipient.length < 25) ? req.recipient : ''

    return (
      <div className='_txRecipient'>
        <div className='_txRecipientInner'>
        <div className='_txLabel'>
            Recipient
          </div>
          {req.data.to ? (
            <div className='_txRecipientSlice _txRecipientValue'>
              {ensName
                ? <span>{ensName}</span>
                : <span>{req.data.to.substring(0, 6)}{svg.octicon('kebab-horizontal', { height: 15 })}{req.data.to.substr(req.data.to.length - 4)}</span>
              }
              {req.decodedData && req.decodedData.contractName ? ( 
                <span className={'_txRecipientContract'}>{(() => {
                  if (req.decodedData.contractName.length > 11) return `${req.decodedData.contractName.substr(0, 9)}..`
                  return req.decodedData.contractName
                })()}</span>
              ) : null}
              <div className='_txRecipientFull' onClick={() => {
                this.copyAddress(req.data.to)
              }}>
                {this.state.copied ? 'Address Copied' : req.data.to}
              </div>
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
