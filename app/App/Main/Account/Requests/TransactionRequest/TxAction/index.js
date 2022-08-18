import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../../resources/link'
import svg from '../../../../../../../resources/svg'
import utils from 'web3-utils'
import { getAddress } from '@ethersproject/address'

class TxSending extends React.Component {
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
  hexToDisplayValue (hex) {
    return (Math.round(parseFloat(utils.fromWei(hex, 'ether')) * 1000000) / 1000000).toFixed(6)
  }
  render () {
    const req = this.props.req
    const { action } = this.props
    const { amount, decimals, name, recipient, symbol, recipientType, recipientEns } = action.data || {}

    const address = recipient
    const ensName = (req.recipient && req.recipient.length < 25) ? req.recipient : ''
    const layer = this.store('main.networks', this.props.chain.type, this.props.chain.id, 'layer')
    const nativeCurrency = this.store('main.networksMeta', this.props.chain.type, this.props.chain.id, 'nativeCurrency')
    const etherUSD = nativeCurrency && nativeCurrency.usd && layer !== 'testnet' ? nativeCurrency.usd.price : 0
    const value = req.data.value || '0x'
    const displayValue = this.hexToDisplayValue(value)
    const currentSymbol = this.store('main.networks', this.props.chain.type, this.props.chain.id, 'symbol') || '?'
    const chainId = parseInt(this.props.chain.id, 16)
    const chainName = this.store('main.networks.ethereum', chainId, 'name')

    if (action.type === 'erc20:transfer') {
      const value = amount
      return (
        <div className='_txMain' style={{ animationDelay: (0.1 * this.props.i) + 's' }}>
          <div className='_txMainInner'>
            <div className='_txLabel'>
              <div>{`Sending ${symbol}`}</div>
            </div>
            <div className='_txMainValues'>
              <div className='_txMainTransferring'>
                <div className='_txMainTransferringPart _txMainTransferringPartLarge'>
                  <span className='_txMainTransferringSymbol'>{symbol}</span>
                  <span className='_txMainTransferringAmount'>{displayValue}</span>
                </div>
                <div className='_txMainTransferringPart'>
                  <span className='_txMainTransferringEq'>{'≈'}</span>
                  <span className='_txMainTransferringEqSymbol'>{'$'}</span>
                  <span className='_txMainTransferringEqAmount'>{(displayValue * etherUSD).toFixed(2)}</span>
                </div>
              </div>
              {address && recipientType === 'contract' ? (
                <div className='_txMainTag'>
                  {`to contract on ${chainName}`}
                </div>
              ) : address ? (
                <div className='_txMainTag'>
                  {`to account on ${chainName}`}
                </div>
              ) : null}
              {address ? (
                <div className='_txMainValue'>
                  {recipientEns
                    ? <span className='_txRecipient'>{recipientEns}</span>
                    : <span className='_txRecipient'>{address.substring(0, 8)}{svg.octicon('kebab-horizontal', { height: 15 })}{address.substring(address.length - 6)}</span>
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
              ) : null}
            </div>
          </div>
        </div>
      )
    }
    return null
  }
}

export default Restore.connect(TxSending)
