import React from 'react'
import Restore from 'react-restore'
import utils from 'web3-utils'
import svg from '../../../../../../svg'
import link from '../../../../../../link'

import TxBar from './TxBar'

class TransactionRequest extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = { allowInput: false, dataView: false }
    setTimeout(() => {
      this.setState({ allowInput: true })
    }, 1500)
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
    let req = this.props.req
    let notice = req.notice
    let mode = req.mode
    let requestClass = 'signerRequest'
    if (mode === 'monitor') requestClass += ' signerRequestMonitor'
    let success = req.status === 'confirming' || req.status === 'confirmed'
    let error = req.status === 'error' || req.status === 'declined'
    if (success) requestClass += ' signerRequestSuccess'
    if (req.status === 'confirmed') requestClass += ' signerRequestConfirmed'
    else if (error) requestClass += ' signerRequestError'
    let etherRates = this.store('external.rates')
    let etherUSD = etherRates && etherRates.USD ? parseFloat(etherRates.USD) : 0
    let value = this.hexToDisplayValue(req.data.value || '0x')
    let fee = this.hexToDisplayValue(utils.numberToHex(parseInt(req.data.gas, 16) * parseInt(req.data.gasPrice, 16)))
    let height = mode === 'monitor' ? '145px' : '370px'
    let confirmations = req.tx && req.tx.confirmations ? req.tx.confirmations : 0
    // let txStatus = req.tx && req.tx.receipt ? req.tx.receipt.status : false
    let statusClass = 'txStatus'
    if (!success && !error) statusClass += ' txStatusCompact'
    return (
      <div key={req.handlerId} className={requestClass} style={{ transform: `translateY(${this.props.pos}px)`, height, zIndex: this.props.z }}>
        <div className='requestOverlay'><div className='requestSheen' /></div>
        {req.type === 'transaction' ? (
          <div className='approveTransaction'>
            <div className='approveTransactionPayload'>
              {notice ? (
                <div className='requestNotice'>
                  <div className='requestNoticeInner'>
                    <div className={statusClass}>
                      <div className='txProgressNotice'>
                        <div className='txProgressDetailText'>
                          {success ? (
                            <div className='txProgressDetailHash' onMouseDown={() => link.send('tray:openEtherscan', req.tx.hash)}>
                              {req.tx.hash.substring(0, 14)}
                              {svg.octicon('kebab-horizontal', { height: 14 })}
                              {req.tx.hash.substr(req.tx.hash.length - 12)}
                            </div>
                          ) : (
                            <div>{notice}</div>
                          )}
                        </div>
                        <div className='txProgressDetailExpand' onMouseDown={() => link.send('tray:openEtherscan', req.tx.hash)}>{'View on Etherscan '}</div>
                      </div>
                    </div>
                    <TxBar req={req} />
                    <div className='monitorIcon'>{svg.octicon('radio-tower', { height: 17 })}</div>
                    <div className='monitorIconIndicator' />
                    <div className='monitorTop'>
                      <div className='monitorValue'><span>{'Ξ'}</span>{value}</div>
                      <div className='monitorArrow'>{svg.longArrow(14)}</div>
                      <div className='monitorTo'>
                        {req.data.to.substring(0, 6)}
                        {svg.octicon('kebab-horizontal', { height: 14 })}
                        {req.data.to.substr(req.data.to.length - 4)}
                      </div>
                    </div>
                    <div className='monitorConfirms'>
                      {[...Array(12).keys()].map(i => {
                        let monitorConfirmsItem = confirmations > i ? 'txProgressConfirmsItem txProgressConfirmsItemGood' : 'txProgressConfirmsItem'
                        return <div key={i} className={monitorConfirmsItem}>{svg.octicon('chevron-right', { height: 14 })}</div>
                      })}
                    </div>
                  </div>
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
                  {utils.toAscii(req.data.data || '0x') ? (
                    <div className={this.state.dataView ? 'transactionData transactionDataSelected' : 'transactionData'}>
                      <div className='transactionDataHeader' onMouseDown={() => this.toggleDataView()}>
                        <div className='transactionDataNotice'>{svg.octicon('issue-opened', { height: 22 })}</div>
                        <div className='transactionDataLabel'>{'View Data'}</div>
                        <div className='transactionDataIndicator'>{svg.octicon('chevron-down', { height: 22 })}</div>
                      </div>
                      <div className='transactionDataBody'>
                        <div className='transactionDataBodyInner'>
                          {req.data.data}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='transactionData transactionNoData'>{'No Data'}</div>
                  )}
                  {req.data.to ? (
                    <div className='transactionTo'>
                      <div className='transactionToAddress'>
                        <div className='transactionToAddressLarge'>{req.data.to.substring(0, 11)} {svg.octicon('kebab-horizontal', { height: 20 })} {req.data.to.substr(req.data.to.length - 11)}</div>
                        <div className='transactionToAddressFull'>
                          {this.state.copied ? <span>{'Copied'}{svg.octicon('clippy', { height: 10 })}</span> : req.data.to}
                          <input tabIndex='-1' onMouseDown={e => this.copyAddress(e)} value={req.data.to} readOnly />
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
          <div className='unknownType'>{'Unknown: ' + req.type}</div>
        )}
        {!notice ? (
          <div className='requestApprove'>
            <div className='requestDecline' onMouseDown={() => { if (this.state.allowInput) this.decline(req.handlerId, req) }}>
              <div className='requestDeclineButton'>{'Decline'}</div>
            </div>
            <div className='requestSign' onMouseDown={() => { if (this.state.allowInput) this.approve(req.handlerId, req) }}>
              <div className='requestSignButton'> {'Sign'} </div>
            </div>
          </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(TransactionRequest)
