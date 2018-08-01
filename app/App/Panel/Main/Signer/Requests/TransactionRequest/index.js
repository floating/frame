import React from 'react'
import Restore from 'react-restore'
import utils from 'web3-utils'
import svg from '../../../../../../svg'

class TransactionRequest extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {allowInput: false, dataView: false}
    setTimeout(() => {
      this.setState({allowInput: true})
    }, 2000)
  }
  approve (reqId, req) {
    this.store.events.emit('approveRequest', reqId, req)
  }
  decline (reqId, req) {
    this.store.events.emit('declineRequest', reqId, req)
  }
  toggleDataView (id) {
    this.setState({dataView: !this.state.dataView})
  }
  render () {
    let requestClass = 'signerRequest'
    if (this.props.req.status === 'success') requestClass += ' signerRequestSuccess'
    if (this.props.req.status === 'declined') requestClass += ' signerRequestDeclined'
    if (this.props.req.status === 'pending') requestClass += ' signerRequestPending'
    if (this.props.req.status === 'error') requestClass += ' signerRequestError'
    let etherRates = this.store('external.rates')
    let etherUSD = etherRates && etherRates.USD ? parseFloat(etherRates.USD) : 0
    let value = this.props.req.data.value || '0x'
    let fee = utils.numberToHex(parseInt(this.props.req.data.gas, 16) * parseInt(this.props.req.data.gasPrice, 16))
    value = parseFloat(utils.fromWei(value, 'ether')).toFixed(6)
    fee = parseFloat(utils.fromWei(fee, 'ether')).toFixed(6)
    return (
      <div key={this.props.req.id || this.props.req.handlerId} className={requestClass} style={{top: (this.props.top * 10) + 'px'}}>
        {this.props.req.type === 'approveTransaction' ? (
          <div className='approveTransaction'>
            <div className='approveTransactionPayload'>
              {this.props.req.notice ? (
                <div className='requestNotice'>
                  {(_ => {
                    if (this.props.req.status === 'pending') {
                      return (
                        <div key={this.props.req.status} className='requestNoticeInner bounceIn'>
                          <div style={{paddingBottom: '20px'}}><div className='loader' /></div>
                          <div className='requestNoticeInnerText'>{'See Signer'}</div>
                        </div>
                      )
                    } else if (this.props.req.status === 'success') {
                      return (
                        <div key={this.props.req.status} className='requestNoticeInner bounceIn'>
                          <div>{svg.octicon('check', {height: '80px'})}</div>
                          <div className='requestNoticeInnerText'>{this.props.req.notice}</div>
                        </div>
                      )
                    } else if (this.props.req.status === 'error' || this.props.req.status === 'declined') {
                      return (
                        <div key={this.props.req.status} className='requestNoticeInner bounceIn'>
                          <div>{svg.octicon('circle-slash', {height: '80px'})}</div>
                          <div className='requestNoticeInnerText'>{this.props.req.notice}</div>
                        </div>
                      )
                    } else {
                      return <div key={this.props.req.notice} className='requestNoticeInner bounceIn'>{this.props.req.notice}</div>
                    }
                  })()}
                </div>
              ) : (
                <React.Fragment>
                  <div className='approveTransactionIcon'>
                    {svg.octicon('radio-tower', {height: '20px'})}
                  </div>
                  <div className='approveRequestTitle approveTransactionTitle'>{'Transaction'}</div>
                  <div className='transactionTotal'>
                    <div className='transactionSub'>
                      <div className='transactionSubValue'>
                        <div className='transactionSubTotals'>
                          <div className='transactionSubTotalETH'>{'Ξ ' + value}</div>
                          <div className='transactionSubTotalUSD'>{'$ ' + (value * etherUSD).toFixed(2)}</div>
                        </div>
                        <div className='transactionSubSubtitle'>{'Value'}</div>
                      </div>
                      <div className='transactionSubFee'>
                        <div className='transactionSubTotals'>
                          <div className='transactionSubTotalETH'>{'Ξ ' + fee}</div>
                          <div className='transactionSubTotalUSD'>{'$ ' + (fee * etherUSD).toFixed(2)}</div>
                        </div>
                        <div className='transactionSubSubtitle'>{'Max Fee'}</div>
                      </div>
                    </div>
                  </div>
                  {utils.toAscii(this.props.req.data.data || '0x') ? (
                    <div className='transactionData'>
                      <div className={this.state.dataView ? 'transactionDataView transactionDataViewSelected' : 'transactionDataView'}>
                        <div className='transactionDataViewLabel' onClick={() => this.toggleDataView()}>{'View Data'}</div>
                        <div className='transactionDataViewData'>
                          <div className='transactionDataViewDataInner'>
                            <div className='transactionDataViewDataHeader'>
                              {'Transaction Data'}
                              <div className='transactionDataViewDataClose' onClick={() => this.toggleDataView()}>{svg.octicon('chevron-down', {height: '20px'})}</div>
                            </div>
                            <div className='transactionDataViewDataBody'>
                              {utils.toAscii(this.props.req.data.data)}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className='transactionDataNotice'>
                        <div className='transactionDataNoticeIcon'>{svg.octicon('issue-opened', {height: '20px'})}</div>
                        <div className='transactionDataNoticeBackground' />
                      </div>
                    </div>
                  ) : (
                    <div className='transactionData transactionNoData'>{'No Data'}</div>
                  )}
                  {this.props.req.data.to ? (
                    <div className='transactionTo'>
                      <div className='transactionToAddress'>
                        <div className='transactionToAddressLarge'>{this.props.req.data.to.substring(0, 11)} {svg.octicon('kebab-horizontal', {height: '20px'})} {this.props.req.data.to.substr(this.props.req.data.to.length - 11)}</div>
                        <div className='transactionToAddressFull'>{this.props.req.data.to}</div>
                      </div>
                      <div className='transactionToSub'>{'Send To'}</div>
                    </div>
                  ) : (
                    <div className='transactionTo'>
                      <div className='transactionToSub'>{'Deploying Contract'}</div>
                    </div>
                  )}
                </React.Fragment>
              )}
            </div>
          </div>
        ) : (
          <div className='unknownType'>{'Unknown: ' + this.props.req.type}</div>
        )}
        <div className='requestApprove'>
          <div className='requestDecline' onClick={() => { if (this.state.allowInput) this.decline(this.props.req.handlerId, this.props.req) }}>
            {svg.octicon('circle-slash', {height: '20px'})}{'Decline'}
          </div>
          <div className='requestSign' onClick={() => { if (this.state.allowInput) this.approve(this.props.req.handlerId, this.props.req) }}>
            {svg.octicon('check', {height: '22px'})}{'Sign'}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(TransactionRequest)
