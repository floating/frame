import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../../../../resources/svg'
import link from '../../../../../../../resources/link'

import {
  Cluster,
  ClusterBox,
  ClusterValue,
  ClusterRow
} from '../../../../../../../resources/Components/Cluster'

class BasicApproval extends React.Component {
  render() {
    const { req, approval } = this.props
    return (
      <div className='approveTransactionWarning'>
        <div className='approveTransactionWarningBody'>
          <Cluster>
            <ClusterRow>
              <ClusterValue>
                <div className='approveTransactionWarningTitle'>
                  <div className='approveTransactionWarningIcon approveTransactionWarningIconLeft'>
                    {svg.alert(32)}
                  </div>
                  {'estimated to fail'}
                  <div className='approveTransactionWarningIcon approveTransactionWarningIconRight'>
                    {svg.alert(32)}
                  </div>
                </div>
              </ClusterValue>
            </ClusterRow>
            <ClusterRow>
              <ClusterValue
                onClick={() => {
                  link.rpc('declineRequest', req, () => {})
                }}
              >
                <div className='_txActionButton _txActionButtonBad'>{'Reject'}</div>
              </ClusterValue>
              <ClusterValue
                onClick={() => {
                  link.rpc('confirmRequestApproval', req, approval.type, {}, () => {})
                }}
              >
                <div className='_txActionButton _txActionButtonGood'>{'Proceed'}</div>
              </ClusterValue>
            </ClusterRow>
            <ClusterRow>
              <ClusterValue>
                <div className='approveTransactionWarningMessage'>
                  {approval && approval.data && approval.data.message}
                </div>
              </ClusterValue>
            </ClusterRow>
          </Cluster>
        </div>
      </div>
    )
  }
}

export default Restore.connect(BasicApproval)
