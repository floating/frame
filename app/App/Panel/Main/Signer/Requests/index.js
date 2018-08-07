import React from 'react'
import Restore from 'react-restore'
import { CSSTransitionGroup } from 'react-transition-group'

import rpc from '../../../../../rpc'

import ProviderRequest from './ProviderRequest'
import TransactionRequest from './TransactionRequest'

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
        <div className='requestContainerWrap'>
          <CSSTransitionGroup className='requestContainer' style={{height: (350 + (requests.length * 10)) + 'px'}} transitionName='slideUp' transitionEnterTimeout={960} transitionLeaveTimeout={640}>
            <div key={'noReq'} style={requests.length !== 0 ? {opacity: 0} : {transitionDelay: '0.32s'}} className='noRequests'>{'No Pending Requests'}</div>
            {requests.sort((a, b) => {
              if (a.type === 'approveTransaction' && b.type !== 'approveTransaction') return 1
              if (a.type !== 'approveTransaction' && b.type === 'approveTransaction') return -1
              return 0
            }).map((req, i) => {
              if (req.type === 'approveTransaction') return <TransactionRequest key={req.handlerId} req={req} top={requests.length - i} />
              if (req.type === 'requestProvider') return <ProviderRequest key={req.handlerId} req={req} top={requests.length - i} />
              return null
            })}
          </CSSTransitionGroup>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Requests)
