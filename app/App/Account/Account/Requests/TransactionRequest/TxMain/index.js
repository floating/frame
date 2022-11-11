import React from 'react'
import Restore from 'react-restore'
import { BigNumber } from 'bignumber.js'

import link from '../../../../../../../resources/link'
import svg from '../../../../../../../resources/svg'
import { Cluster, ClusterRow, ClusterValue } from '../../../../../../../resources/Components/Cluster'
import { getAddress } from '../../../../../../../resources/domain/transaction'
import { displayValueData } from '../../../../../../../resources/utils/displayValue'

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
    setTimeout(() => this.setState({ copied: false }), 1000)
  }

  render () {
    const req = this.props.req
    const value = req.data.value || '0x'
    if (BigNumber(value).isZero()) {
      return null
    }

    const address = req.data.to ? getAddress(req.data.to) : ''
    const ensName = (req.recipient && req.recipient.length < 25) ? req.recipient : ''
    const isTestnet = this.store('main.networks', this.props.chain.type, this.props.chain.id, 'isTestnet')
    const { nativeCurrency, nativeCurrency: { symbol: currentSymbol = '?' }} = this.store('main.networksMeta', this.props.chain.type, this.props.chain.id)
    const chainName = this.store('main.networks.ethereum', this.props.chain.id, 'name')
    const { ether, fiat } = displayValueData(value, { currencyRate: nativeCurrency, isTestnet })
    
    return (
      <div className='_txMain' style={{ animationDelay: (0.1 * this.props.i) + 's' }}>
        <div className='_txMainInner'>
          <div className='_txLabel'>
            <div>{`Send ${currentSymbol}`}</div>
          </div>
          <Cluster>
            <ClusterRow>
              <ClusterValue grow={2}>
                <div className='txSendingValue'>
                  <span className='txSendingValueSymbol'>{currentSymbol}</span>
                  <span className='txSendingValueAmount'>{`${ether.displayValue}${ether.displayUnit ? ether.displayUnit : ''}`}</span>
                </div>
              </ClusterValue>
              <ClusterValue>
                <span className='_txMainTransferringEq'>{'≈'}</span>
                <span className='_txMainTransferringEqSymbol'>{'$'}</span>
                <span className='_txMainTransferringEqAmount'>`${fiat.displayValue}${fiat.displayUnit ? fiat.displayUnit : ''}`</span>
              </ClusterValue>
            </ClusterRow>

            {address && req.recipientType === 'contract' ? (
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
        </div>
      </div>
    )
  }
}

export default Restore.connect(TxSending)
