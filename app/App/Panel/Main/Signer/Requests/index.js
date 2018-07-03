import React from 'react'
import Restore from 'react-restore'
import Web3 from 'web3'
import { CSSTransitionGroup } from 'react-transition-group'

import svg from '../../../../../svg'
import rpc from '../../../../../rpc'

class Requests extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {minimized: false}
  }
  trezorPin (num) {
    this.tPin = this.tPin ? this.tPin + num.toString() : num.toString()
    if (this.tPin.length === 4) {
      rpc('trezorPin', this.props.id, this.tPin, (err, status) => {
        if (err) throw new Error(err)
      })
      this.tPin = ''
    }
  }
  minimize () {
    this.setState({minimized: true})
  }
  setSigner () {
    this.setState({minimized: false})
    let current = this.store('signer.current') === this.props.id
    if (!current) {
      rpc('setSigner', this.props.id, (err, status) => {
        if (err) throw new Error(err)
      })
    }
  }
  approve (reqId, req) {
    this.store.events.emit('approveRequest', reqId, req)
  }
  decline (reqId, req) {
    this.store.events.emit('declineRequest', reqId, req)
  }
  transactionRequest (req, top) {
    let requestClass = 'signerRequest'
    if (req.status === 'success') requestClass += ' signerRequestSuccess'
    if (req.status === 'declined') requestClass += ' signerRequestDeclined'
    if (req.status === 'pending') requestClass += ' signerRequestPending'
    if (req.status === 'error') requestClass += ' signerRequestError'
    let etherRates = this.store('external.rates')
    let etherUSD = etherRates && etherRates.USD ? parseFloat(etherRates.USD) : 0
    let value = req.data.value || '0x'
    let fee = Web3.utils.numberToHex(parseInt(req.data.gas, 16) * parseInt(req.data.gasPrice, 16))
    value = Web3.utils.fromWei(value, 'ether')
    fee = Web3.utils.fromWei(fee, 'ether')
    value = ((Math.round(value * 100000000) / 100000000).toString() + '00000000').substring(0, 8)
    fee = ((Math.round(fee * 100000000) / 100000000).toString() + '00000000').substring(0, 8)
    return (
      <div key={req.id || req.handlerId} className={requestClass} style={{top: (top * 10) + 'px'}}>
        {req.type === 'approveTransaction' ? (
          <div className='approveTransaction'>
            <div className='approveTransactionPayload'>
              {req.notice ? (
                <div className='requestNotice'>
                  {(_ => {
                    if (req.status === 'pending') {
                      return (
                        <div key={req.status} className='requestNoticeInner bounceIn'>
                          <div style={{paddingBottom: '20px'}}><div className='loader' /></div>
                          <div className='requestNoticeInnerText'>{'See Signer'}</div>
                        </div>
                      )
                    } else if (req.status === 'success') {
                      return (
                        <div key={req.status} className='requestNoticeInner bounceIn'>
                          <div>{svg.octicon('check', {height: '80px'})}</div>
                          <div className='requestNoticeInnerText'>{req.notice}</div>
                        </div>
                      )
                    } else if (req.status === 'error' || req.status === 'declined') {
                      return (
                        <div key={req.status} className='requestNoticeInner bounceIn'>
                          <div>{svg.octicon('circle-slash', {height: '80px'})}</div>
                          <div className='requestNoticeInnerText'>{req.notice}</div>
                        </div>
                      )
                    } else {
                      return <div key={req.notice} className='requestNoticeInner bounceIn'>{req.notice}</div>
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
                  {Web3.utils.toAscii(req.data.data || '0x') ? (
                    <div className='transactionData'>{'View Data'} </div>
                  ) : (
                    <div className='transactionData transactionNoData'>{'No Data'}</div>
                  )}
                  {req.data.to ? (
                    <div className='transactionTo'>
                      <div className='transactionToAddress'>
                        <div className='transactionToAddressLarge'>{req.data.to.substring(0, 11)} {svg.octicon('kebab-horizontal', {height: '20px'})} {req.data.to.substr(req.data.to.length - 11)}</div>
                        <div className='transactionToAddressFull'>{req.data.to}</div>
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
        <div className='requestApprove'>
          <div className='requestDecline' onClick={() => this.decline(req.handlerId, req)}>
            {svg.octicon('circle-slash', {height: '20px'})}{'Decline'}
          </div>
          <div className='requestSign' onClick={() => this.approve(req.handlerId, req)}>
            {svg.octicon('check', {height: '22px'})}{'Sign'}
          </div>
        </div>
      </div>
    )
  }
  providerRequest (req, top) {
    let requestClass = 'signerRequest'
    if (req.status === 'success') requestClass += ' signerRequestSuccess'
    if (req.status === 'declined') requestClass += ' signerRequestDeclined'
    if (req.status === 'pending') requestClass += ' signerRequestPending'
    if (req.status === 'error') requestClass += ' signerRequestError'
    return (
      <div key={req.id || req.handlerId} className={requestClass} style={{top: (top * 10) + 'px'}}>
        <div className='approveTransaction'>
          {req.notice ? (
            <div className='requestNotice'>
              {(_ => {
                if (req.status === 'pending') {
                  return (
                    <div className='requestNoticeInner bounceIn'>
                      <div><div className='loader' /></div>
                    </div>
                  )
                } else if (req.status === 'success') {
                  return <div className='requestNoticeInner bounceIn'>{svg.octicon('check', {height: '80px'})}</div>
                } else if (req.status === 'error' || req.status === 'declined') {
                  return <div className='requestNoticeInner bounceIn'>{svg.octicon('circle-slash', {height: '80px'})}</div>
                }
              })()}
            </div>
          ) : (
            <div className='approveTransactionPayload'>
              <div className='approveTransactionIcon'>
                {svg.octicon('link', {height: '20px'})}
              </div>
              <div className='approveRequestTitle'>
                {'Provider Request'}
              </div>
              <div className='requestProvider bounceIn'>
                <div className='requestProviderOrigin'>{req.origin}</div>
                <div className='requestProviderSub'>{'wants to connect'}</div>
              </div>
            </div>
          )}
        </div>
        <div className='requestApprove'>
          <div className='requestDecline' onClick={() => this.store.giveAccess(req, false)}>
            {svg.octicon('circle-slash', {height: '20px'})}{'Decline'}
          </div>
          <div className='requestSign' onClick={() => this.store.giveAccess(req, true)}>
            {svg.octicon('check', {height: '22px'})}{'Approve'}
          </div>
        </div>
      </div>
    )
  }
  render () {
    let requests = this.store('signer.requests')
    requests = Object.keys(requests).map(key => requests[key]).filter(req => {
      if (req.type === 'approveTransaction') return this.props.accounts.map(a => a.toLowerCase()).indexOf(req && req.data ? req.data.from.toLowerCase() : null) > -1
      return true
    })
    return (
      <div className={this.store('signer.view') === 'default' ? 'signerRequests' : 'signerRequests signerRequestsHidden'}>
        <div className='requestTitle'>
          <div>{'Requests'}</div>
          <div className='requestCount'>{requests.length}</div>
        </div>
        <div className='requestObsverver'>
          <div className='requestContainer'>
            <div key={'noReq'} style={requests.length !== 0 ? {opacity: 0} : {transitionDelay: '0.32s'}} className='noRequests'>{'No Pending Requests'}</div>
            <CSSTransitionGroup style={{width: '100%'}} transitionName='slideUp' transitionEnterTimeout={960} transitionLeaveTimeout={640}>
              {requests.sort((a, b) => {
                if (a.type === 'approveTransaction' && b.type !== 'approveTransaction') return 1
                if (a.type !== 'approveTransaction' && b.type === 'approveTransaction') return -1
                return 0
              }).map((req, i) => {
                if (req.type === 'approveTransaction') return this.transactionRequest(req, requests.length - i)
                if (req.type === 'requestProvider') return this.providerRequest(req, requests.length - i)
                return null
              })}
            </CSSTransitionGroup>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Requests)
