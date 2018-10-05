import React from 'react'
import Restore from 'react-restore'
import utils from 'web3-utils'
import svg from '../../../../../../svg'
import link from '../../../../../../link'

class TransactionRequest extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = { allowInput: false, dataView: false }
    setTimeout(() => {
      this.setState({ allowInput: true })
    }, 2000)
  }
  copyAddress (e) {
    e.preventDefault()
    e.target.select()
    document.execCommand('Copy')
    this.setState({ copied: true })
    setTimeout(_ => this.setState({ copied: false }), 1000)
  }
  approve (reqId, req) {
    link.rpc('approveRequest', req, () => {}) // Move to link.send
  }
  decline (reqId, req) {
    link.rpc('declineRequest', req, () => {}) // Move to link.send
  }
  toggleDataView (id) {
    this.setState({ dataView: !this.state.dataView })
  }
  hexToDisplayValue (hex) {
    return (Math.round(parseFloat(utils.fromWei(hex, 'ether')) * 1000000) / 1000000).toFixed(6)
  }
  render () {
    let status = this.props.req.status
    let notice = this.props.req.notice
    let requestClass = 'signerRequest'
    if (status === 'success') requestClass += ' signerRequestSuccess'
    if (status === 'declined') requestClass += ' signerRequestDeclined'
    if (status === 'pending') requestClass += ' signerRequestPending'
    if (status === 'error') requestClass += ' signerRequestError'
    let etherRates = this.store('external.rates')
    let etherUSD = etherRates && etherRates.USD ? parseFloat(etherRates.USD) : 0
    let value = this.hexToDisplayValue(this.props.req.data.value || '0x')
    let fee = this.hexToDisplayValue(utils.numberToHex(parseInt(this.props.req.data.gas, 16) * parseInt(this.props.req.data.gasPrice, 16)))
    return (
      <div key={this.props.req.id || this.props.req.handlerId} className={requestClass} style={{ top: (this.props.top * 10) + 'px' }}>
        <div className='requestOverlay'><div className='requestOverlayInset' /></div>
        {this.props.req.type === 'approveTransaction' ? (
          <div className='approveTransaction'>
            <div className='approveTransactionPayload'>
              {notice ? (
                <div className='requestNotice'>
                  {(_ => {
                    if (status === 'pending') {
                      return (
                        <div key={status} className='requestNoticeInner bounceIn'>
                          <div style={{ paddingBottom: 20 }}><div className='loader' /></div>
                          <div className='requestNoticeInnerText'>{'See Signer'}</div>
                        </div>
                      )
                    } else if (status === 'success') {
                      return (
                        <div key={status} className='requestNoticeInner bounceIn'>
                          <div>{svg.octicon('check', { height: 80 })}</div>
                          <div className='requestNoticeInnerText'>{notice}</div>
                        </div>
                      )
                    } else if (status === 'error' || status === 'declined') {
                      return (
                        <div key={status} className='requestNoticeInner bounceIn'>
                          <div>{svg.octicon('circle-slash', { height: 80 })}</div>
                          <div className='requestNoticeInnerText'>{notice}</div>
                        </div>
                      )
                    } else {
                      return <div key={notice} className='requestNoticeInner bounceIn'>{notice}</div>
                    }
                  })()}
                </div>
              ) : (
                <React.Fragment>
                  <div className='approveRequestHeader approveTransactionHeader'>
                    <div className='approveRequestHeaderIcon'> {svg.octicon('radio-tower', { height: 22 })}</div>
                    <div className='approveRequestHeaderLabel'> {'Transaction'}</div>
                  </div>
                  <div className='transactionValue'>
                    <div className='transactionTotals'>
                      <div className='transactionTotalETH'>{'Ξ ' + value}</div>
                      <div className='transactionTotalUSD'>{'$ ' + (value * etherUSD).toFixed(2)}</div>
                    </div>
                    <div className='transactionSubtitle'>{'Value'}</div>
                  </div>
                  <div className='transactionFee'>
                    <div className='transactionTotals'>
                      <div className='transactionTotalETH'>{'Ξ ' + fee}</div>
                      <div className='transactionTotalUSD'>{'$ ' + (fee * etherUSD).toFixed(2)}</div>
                    </div>
                    <div className='transactionSubtitle'>{'Max Fee'}</div>
                  </div>
                  {utils.toAscii(this.props.req.data.data || '0x') ? (
                    <div className={this.state.dataView ? 'transactionData transactionDataSelected' : 'transactionData'}>
                      <div className='transactionDataHeader' onMouseDown={() => this.toggleDataView()}>
                        <div className='transactionDataNotice'>{svg.octicon('issue-opened', { height: 22 })}</div>
                        <div className='transactionDataLabel'>{'View Data'}</div>
                        <div className='transactionDataIndicator'>{svg.octicon('chevron-down', { height: 22 })}</div>
                      </div>
                      <div className='transactionDataBody'>
                        <div className='transactionDataBodyInner'>
                          {this.props.req.data.data}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='transactionData transactionNoData'>{'No Data'}</div>
                  )}
                  {this.props.req.data.to ? (
                    <div className='transactionTo'>
                      <div className='transactionToAddress'>
                        <div className='transactionToAddressLarge'>{this.props.req.data.to.substring(0, 11)} {svg.octicon('kebab-horizontal', { height: 20 })} {this.props.req.data.to.substr(this.props.req.data.to.length - 11)}</div>
                        <div className='transactionToAddressFull'>
                          {this.state.copied ? <span>{'Copied'}{svg.octicon('clippy', { height: 10 })}</span> : this.props.req.data.to}
                          <input onMouseDown={e => this.copyAddress(e)} value={this.props.req.data.to} readOnly />
                        </div>
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
          <div className='requestDecline' onMouseDown={() => { if (this.state.allowInput) this.decline(this.props.req.handlerId, this.props.req) }}>
            <div className='requestDeclineButton'>{'Decline'}</div>
          </div>
          <div className='requestSign' onMouseDown={() => { if (this.state.allowInput) this.approve(this.props.req.handlerId, this.props.req) }}>
            <div className='requestSignButton'> {'Sign'} </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(TransactionRequest)
