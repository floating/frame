import React from 'react'
import Restore from 'react-restore'
import Web3 from 'web3'

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
  decline (reqId) {
    this.store.declineRequest(reqId)
  }
  transactionRequest (req, i) {
    let requestClass = 'signerRequest'
    if (req.status === 'success') requestClass += ' signerRequestSuccess'
    if (req.status === 'declined') requestClass += ' signerRequestDeclined'
    if (req.status === 'pending') requestClass += ' signerRequestPending'
    return (
      <div key={i} className={requestClass}>
        {req.type === 'approveTransaction' ? (
          <div className='approveTransaction'>
            <div className='approveTransactionPayload'>
              {req.notice ? (
                <div className='requestNotice'>{req.notice}</div>
              ) : (
                <React.Fragment>
                  <div> {svg.octicon('radio-tower', {height: '40px'})} </div>
                  <div className='approveTransactionTitle'>
                    {'Approve Transaction'}
                  </div>
                  <div> {Web3.utils.fromWei(req.data.value, 'ether') + 'eth'} </div>
                  {Web3.utils.toAscii(req.data.data) ? (
                    <div>  {'data: ' + Web3.utils.toAscii(req.data.data)} </div>
                  ) : (
                    <div>  {' no data '} </div>
                  )}
                  <div>  {'to: ' + req.data.to} </div>
                </React.Fragment>
              )}
            </div>
          </div>
        ) : (
          <div className='unknownType'>{'Unknown: ' + req.type}</div>
        )}
        <div className='requestApprove'>
          <div className='requestDecline' onClick={() => this.decline(req.handlerId)}>{'Decline'}</div>
          <div className='requestSign' onClick={() => this.approve(req.handlerId, req)}>{'Sign'}</div>
        </div>
      </div>
    )
  }
  providerRequest (req, i) {
    let requestClass = 'signerRequest'
    if (req.status === 'success') requestClass += ' signerRequestSuccess'
    if (req.status === 'declined') requestClass += ' signerRequestDeclined'
    if (req.status === 'pending') requestClass += ' signerRequestPending'
    return (
      <div key={i} className={requestClass}>
        {req.type === 'requestProvider' ? (
          <div className='approveTransaction'>
            <div className='approveTransactionTitle'>{'Request Provider Access'}</div>
            {req.notice ? <div className='requestNotice'>{req.notice}</div> : null}
          </div>
        ) : <div className='unknownType'>{'Unknown: ' + req.type}</div>}
        <div className='requestApprove'>
          <div className='requestDecline' onClick={() => this.store.giveAccess(req, false)}>{'Decline'}</div>
          <div className='requestSign' onClick={() => this.store.giveAccess(req, true)}>{'Approve'}</div>
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
            {requests.length === 0 ? (
              <div key={'noReq'} className='noRequests'>{'No Pending Requests'}</div>
            ) : (_ => {
              let req = requests[0]
              if (req.type === 'approveTransaction') return this.transactionRequest(req, 0)
              if (req.type === 'requestProvider') return this.providerRequest(req, 0)
            })()}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Requests)
