import React from 'react'
import Restore from 'react-restore'
import { CSSTransitionGroup } from 'react-transition-group'

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
    let normal = requests.filter(req => req.mode === 'normal').sort((a, b) => {
      if (a.created > b.created) return -1
      if (a.created < b.created) return 1
      return 0
    })
    let monitor = requests.filter(req => req.mode === 'monitor').sort((a, b) => {
      if (a.created > b.created) return -1
      if (a.created < b.created) return 1
      return 0
    })
    let containNormal = normal.length ? (350 + (normal.length * 10) + 20) : 100
    let containMonitor = monitor.length * 90
    let containHeight = containNormal + containMonitor

    return (
      <div className={this.store('signer.view') === 'default' ? 'signerRequests' : 'signerRequests signerRequestsHidden'}>
        <div className='requestTitle'>
          <div>{'Requests'}</div>
          <div className='requestCount'>{normal.length}</div>
        </div>
        <div className='requestContainerWrap'>
          <CSSTransitionGroup className='requestContainer' style={{ height: containHeight + 'px' }} transitionName='slideUp' transitionEnterTimeout={960} transitionLeaveTimeout={640}>
            <div key={'noReq'} style={normal.length !== 0 ? { opacity: 0 } : { transitionDelay: '0.32s' }} className='noRequests'>{'No Pending Requests'}</div>
            {normal.concat(monitor).map((req, i) => {
              let bottom = 0
              if (req.mode === 'normal') bottom = containMonitor + (i * 10)
              if (req.mode === 'monitor') bottom = (monitor.length - 1 - i - normal.length) * 90
              if (req.type === 'transaction') return <TransactionRequest key={req.handlerId} req={req} bottom={bottom} />
              if (req.type === 'access') return <ProviderRequest key={req.handlerId} req={req} bottom={bottom} />
              if (req.type === 'sign') return <SignatureRequest key={req.handlerId} req={req} bottom={bottom} />
              return null
            })}
          </CSSTransitionGroup>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Requests)
