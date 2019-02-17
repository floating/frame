import React from 'react'
import Restore from 'react-restore'
import utils from 'web3-utils'
import svg from '../../../../../../svg'
import link from '../../../../../../link'

class TransactionBar extends React.Component {
  loading () {
    return (
      <div className='txStepLayerStatusLoading'>
        <div className='txStepLayerStatusLoadingCenter' />
        <div className='txStepLayerStatusLoadingBox' />
      </div>
    )
  }
  icon (type, width, mode) {
    if (type === 'signed') {
      return (
        <div className='txStepLayerStatus' style={{ width, paddingRight: '5px', opacity: mode === 'dim' ? 0.5 : 1 }}>
          {mode === 'loading' ? this.loading() : null}
          <div className='txStepLayerStatusIcon' style={{ width, paddingTop: '5px' }}>{svg.sign(24)}</div>
        </div>
      )
    }
    if (type === 'sent') {
      return (
        <div className='txStepLayerStatus' style={{ width, paddingRight: '8px', opacity: mode === 'dim' ? 0.5 : 1 }}>
          {mode === 'loading' ? this.loading() : null}
          <div className='txStepLayerStatusIcon'>{svg.send(18)}</div>
        </div>
      )
    }
    if (type === 'confirmed') {
      return (
        <div className='txStepLayerStatus' style={{ width, paddingRight: '12px', opacity: mode === 'dim' ? 0.5 : 1 }}>
          {mode === 'loading' ? this.loading() : null}
          <div className='txStepLayerStatusIcon'>{svg.octicon('check', { height: 24 })}</div>
        </div>
      )
    }
    return null
  }
  step (left, width, index, type, phase) {
    let baseZ = 2000 - index
    let right = `calc(100% - ${left + width}px`
    return (
      <div className='txStep' style={{ zIndex: baseZ, right }}>
        <div className={phase === 0 ? 'txStepLayer txStepLayer0 txStepLayerActive' : 'txStepLayer txStepLayer0'} style={{ zIndex: 1, transform: `translateX(-${phase >= 0 ? 0 : width}px)` }}>
          {this.icon(type, width, 'dim')}
          <div className='txStepLayerAngle' />
        </div>
        <div className={phase === 1 ? 'txStepLayer txStepLayer1 txStepLayerActive' : 'txStepLayer txStepLayer1'} style={{ zIndex: 2, transform: `translateX(-${phase >= 1 ? 0 : width}px)` }}>
          {this.icon(type, width, 'loading')}
          <div className='txStepLayerAngle' />
        </div>
        <div className={phase === 2 ? 'txStepLayer txStepLayer2 txStepLayerActive' : 'txStepLayer txStepLayer2'} style={{ zIndex: 3, transform: `translateX(-${phase >= 2 ? 0 : width}px)` }}>
          {this.icon(type, width, 'complete')}
          <div className='txStepLayerAngle' />
        </div>
      </div>
    )
  }
  render () {
    let req = this.props.req
    let mode = req.mode
    let confirmations = req.tx && req.tx.confirmations ? req.tx.confirmations : 0
    let hash = req.tx && req.tx.hash ? req.tx.hash : null
    return (
      <div className='txBar'>
        <div className='txBarSheen' />
        {this.step(0, 70, 0, 'signed', this.props.req.status === 'pending' ? 1 : 2)}
        {this.step(70, 65, 1, 'sent', this.props.req.status === 'pending' ? 0 : hash ? 2 : 1)}
        {this.step(135, 24, 2, 'confirm', confirmations >= 1 ? 2 : confirmations === 0 ? 1 : 0)}
        {this.step(159, 24, 3, 'confirm', confirmations >= 2 ? 2 : confirmations === 1 ? 1 : 0)}
        {this.step(183, 24, 4, 'confirm', confirmations >= 3 ? 2 : confirmations === 2 ? 1 : 0)}
        {this.step(207, 24, 5, 'confirm', confirmations >= 4 ? 2 : confirmations === 3 ? 1 : 0)}
        {this.step(231, 24, 6, 'confirm', confirmations >= 5 ? 2 : confirmations === 4 ? 1 : 0)}
        {this.step(255, 80, 7, 'confirmed', confirmations >= 6 ? 2 : confirmations === 5 ? 1 : 0)}
      </div>
    )
  }
}

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
    let mode = this.props.req.mode
    let requestClass = 'signerRequest'
    if (status === 'success') requestClass += ' signerRequestSuccess'
    if (status === 'declined') requestClass += ' signerRequestDeclined'
    if (status === 'pending') requestClass += ' signerRequestPending'
    if (status === 'error') requestClass += ' signerRequestError'
    if (status === 'monitor') requestClass += ' signerRequestMonitor'
    let etherRates = this.store('external.rates')
    let etherUSD = etherRates && etherRates.USD ? parseFloat(etherRates.USD) : 0
    let value = this.hexToDisplayValue(this.props.req.data.value || '0x')
    let fee = this.hexToDisplayValue(utils.numberToHex(parseInt(this.props.req.data.gas, 16) * parseInt(this.props.req.data.gasPrice, 16)))

    let index = this.props.index
    let total = this.props.total
    let request = this.props.req
    let height = mode === 'monitor' ? '80px' : '370px'

    return (
      <div key={this.props.req.handlerId} className={requestClass} style={{ transform: `translateY(-${this.props.bottom}px)`, height }}>
        <div className='requestOverlay'><div className='requestOverlayInset' /></div>
        {this.props.req.type === 'transaction' ? (
          <div className='approveTransaction'>
            <div className='approveTransactionPayload'>
              {notice ? (
                <div className='requestNotice'>
                  <div className='requestNoticeInner'>
                    <TransactionBar req={this.props.req} />
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
                          <input tabIndex='-1' onMouseDown={e => this.copyAddress(e)} value={this.props.req.data.to} readOnly />
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
