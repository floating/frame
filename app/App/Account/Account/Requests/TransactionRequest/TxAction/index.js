import React, { Children } from 'react'
import Restore from 'react-restore'
import link from '../../../../../../../resources/link'
import {formatEther} from '@ethersproject/units'
import BigNumber from 'bignumber.js'
import Transfer from './erc20/transfer'
import Recipient from './recipient'
import Destination from './destination'
import Register from './ens/register'
import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../../../../resources/Components/Cluster'

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
    return (Math.round(parseFloat(formatEther(hex)) * 1000000) / 1000000).toFixed(6)
  }
  render () {
    const req = this.props.req
    const contract = req.data.to.toLowerCase()
    const chainId = parseInt(req.data.chainId, 16)
    const chainName = this.store('main.networks.ethereum', chainId, 'name')

    const { action } = this.props
    const [actionClass, actionType] = action.id.split(':')

    if (actionClass === 'erc20') {
      if (actionType === 'transfer') {
        const { amount, decimals, name, recipient: recipientAddress, symbol, recipientType, recipientEns } = action.data || {}
        const address = recipientAddress
        const ensName = recipientEns
        const value = new BigNumber(amount) 
        const displayValue = value.dividedBy('1e' + decimals).toFixed(6)
        // const ensName = (recipientEns && recipientEns.length < 25) ? recipientEns : ''

        const isTestnet = this.store('main.networks', this.props.chain.type, this.props.chain.id, 'isTestnet')    
        const rate = this.store('main.rates', contract)
        const rateUSD = rate && rate.usd && !isTestnet ? rate.usd.price : 0
  
        const destination = recipientType && <Destination chain={chainName} recipientType={recipientType} />
        const recipient = recipientAddress && 
          <Recipient
            address={recipientAddress}
            ens={recipientEns}
            copyAddress={(copied) => link.send('tray:clipboardData', copied)}
          />
  
        return (
          <ClusterBox title={`Sending ${symbol}`} subtitle={name} animationSlot={this.props.i}>
            <Cluster>
              <ClusterRow>
                <ClusterValue grow={2}>
                  <div className='txSendingValue'>
                    <span className='txSendingValueSymbol'>{symbol}</span>
                    <span className='txSendingValueAmount'>{displayValue}</span>
                  </div>
                </ClusterValue>
                <ClusterValue>
                  <span className='_txMainTransferringEq'>{'≈'}</span>
                  <span className='_txMainTransferringEqSymbol'>{'$'}</span>
                  <span className='_txMainTransferringEqAmount'>{(displayValue * rateUSD).toFixed(2)}</span>
                </ClusterValue>
              </ClusterRow>
              {address && recipientType === 'contract' ? (
                <ClusterRow>
                  <ClusterValue>
                    <div className='clusterTag'>
                      {`to contract on ${chainName}`}
                    </div>
                  </ClusterValue>
                </ClusterRow>
              ) : address ? (
                <ClusterRow>
                  <ClusterValue>
                    <div className='clusterTag'>
                      {`to account on ${chainName}`}
                    </div>    
                  </ClusterValue>
                </ClusterRow>
              ) : null}

              {address && (
                <ClusterRow>
                  <ClusterValue pointerEvents={true} onClick={() => {
                    this.copyAddress(address)
                  }}>
                    <div className='clusterAddress'>
                      {ensName
                        ? <span className='clusterAddressRecipient'>{ensName}</span>
                        : <span className='clusterAddressRecipient'>{address.substring(0, 8)}{svg.octicon('kebab-horizontal', { height: 15 })}{address.substring(address.length - 6)}</span>
                      }
                      <div className='clusterAddressRecipientFull'>
                        {this.state.copied ? (
                          <span>{'Address Copied'}</span>
                        ) : (
                          <span className='clusterFira'>{address}</span>
                        )}
                      </div>
                    </div>
                  </ClusterValue>
                </ClusterRow>
              )}
            </Cluster>
          </ClusterBox>
        )
      }
    }
  }
}

export default Restore.connect(TxSending)
