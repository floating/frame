import React from 'react'
import Restore from 'react-restore'

import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'

import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../../../resources/Components/Cluster'
import { getAddress } from '../../../../../../resources/utils'

class TxRecipient extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      copied: false
    }
  }

  copyAddress(data) {
    link.send('tray:clipboardData', data)
    this.setState({ copied: true })
    setTimeout((_) => this.setState({ copied: false }), 1000)
  }

  render() {
    const req = this.props.req
    const address = req.data.to ? getAddress(req.data.to) : ''
    const ensName = req.recipient && req.recipient.length < 25 ? req.recipient : ''
    const value = req.data.value || '0x'
    if (req.recipientType !== 'contract' && (value !== '0x' || parseInt(value, 16)) !== 0) return null

    const title = req.recipientType === 'contract' ? 'Calling Contract' : 'Recipient Account'
    return (
      <ClusterBox title={title} animationSlot={this.props.i}>
        <Cluster>
          <ClusterRow>
            <ClusterValue
              pointer={true}
              onClick={() => {
                this.copyAddress(address)
              }}
            >
              <div className='clusterAddress'>
                {ensName ? (
                  <span className='clusterAddressRecipient'>{ensName}</span>
                ) : (
                  <span className='clusterAddressRecipient'>
                    {address.substring(0, 8)}
                    {svg.octicon('kebab-horizontal', { height: 15 })}
                    {address.substring(address.length - 6)}
                  </span>
                )}
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

          {req.decodedData && req.decodedData.method ? (
            <ClusterRow>
              <ClusterValue>
                <span className={'clusterTag'} style={{ color: 'var(--good)', fontSize: '16px' }}>
                  {(() => {
                    if (req.decodedData.method.length > 17) return `${req.decodedData.method.substr(0, 15)}..`
                    return req.decodedData.method
                  })()}
                </span>
              </ClusterValue>
            </ClusterRow>
          ) : req.recipientType === 'contract' ? (
            <ClusterRow>
              <ClusterValue>
                <div className='clusterTag'>{'unknown action via unknown contract'}</div>
              </ClusterValue>
            </ClusterRow>
          ) : null}
          {req.decodedData && req.decodedData.source && (
            <ClusterRow>
              <ClusterValue>
                <div className='clusterTag'>{'abi source: ' + req.decodedData.source}</div>
              </ClusterValue>
            </ClusterRow>
          )}
        </Cluster>
      </ClusterBox>
    )
  }
}

export default Restore.connect(TxRecipient)
