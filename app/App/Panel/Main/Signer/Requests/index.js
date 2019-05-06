import React from 'react'
import Restore from 'react-restore'
// import { CSSTransitionGroup } from 'react-transition-group'

import ProviderRequest from './ProviderRequest'
import TransactionRequest from './TransactionRequest'
import SignatureRequest from './SignatureRequest'

import link from '../../../../../link'

class Requests extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = { minimized: false }
  }
  trezorPin (num) {
    this.tPin = this.tPin ? this.tPin + num.toString() : num.toString()
    if (this.tPin.length === 4) {
      link.rpc('trezorPin', this.props.id, this.tPin, (err, status) => {
        if (err) throw new Error(err)
      })
      this.tPin = ''
    }
  }
  minimize () {
    this.setState({ minimized: true })
  }
  setSigner () {
    this.setState({ minimized: false })
    let current = this.store('signer.current') === this.props.id
    if (!current) {
      link.rpc('setSigner', this.props.id, (err, status) => {
        if (err) throw new Error(err)
      })
    }
  }
  render () {
    let requests = this.store('signers', this.props.id, 'requests') || {}
    requests = Object.keys(requests).map(key => requests[key]).filter(req => {
      if (req.type === 'transaction') return this.props.accounts.map(a => a.toLowerCase()).indexOf(req && req.data ? req.data.from.toLowerCase() : null) > -1
      return true
    })
    let normal = requests.filter(req => req.mode === 'normal')
    normal.sort((a, b) => {
      if (a.created > b.created) return -1
      if (a.created < b.created) return 1
      return 0
    })
    let monitor = requests.filter(req => req.mode === 'monitor')
    monitor.sort((a, b) => {
      if (a.created > b.created) return -1
      if (a.created < b.created) return 1
      return 0
    })
    let monitorHeight = 165
    let containNormal = normal.length ? (360 + (normal.length * 10)) : 160
    if (normal.length && monitor.length > 0) containNormal += 70
    let containMonitor = monitor.length * monitorHeight
    let containHeight = containNormal + containMonitor
    return (
      <div className={this.store('signer.view') === 'default' ? 'signerRequests' : 'signerRequests signerRequestsHidden'}>
        <div className='requestTitle'>
          <div>{'Requests'}</div>
          <div className='requestCount'>{normal.length}</div>
        </div>
        <div className='requestContainerWrap'>
          <div className='requestContainer' style={{ height: containHeight + 'px' }} transitionName='slideUp' transitionEnterTimeout={960} transitionLeaveTimeout={640}>
            <div key={'noReq'} style={normal.length !== 0 ? { opacity: 0 } : { transitionDelay: '0.32s' }} className='noRequests'>{'No Pending Requests'}</div>
            <div className='recentRequests' style={{ opacity: monitor.length > 0 ? 1 : 0, transform: `translateY(${containNormal - 15}px)` }}>
              <span>{'Recent Transactions'}</span>
              <span>{monitor.length}</span>
            </div>
            {normal.concat(monitor).map((req, i) => {
              let pos = 0
              let z = 2000 + i
              if (req.mode === 'normal') pos = ((normal.length - i) * 10)
              if (req.mode === 'monitor') pos = containNormal + 10 + ((i - normal.length) * monitorHeight)
              if (req.type === 'transaction') return <TransactionRequest key={req.handlerId} req={req} pos={pos} z={z} i={i} />
              if (req.type === 'access') return <ProviderRequest key={req.handlerId} req={req} pos={pos} z={z} />
              if (req.type === 'sign') return <SignatureRequest key={req.handlerId} req={req} pos={pos} z={z} />
              return null
            })}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Requests)
