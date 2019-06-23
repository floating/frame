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
    this.state = { minimized: false, unlockInput: '' }
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
    let current = this.store('selected.current') === this.props.id
    if (!current) {
      link.rpc('setSigner', this.props.id, (err, status) => {
        if (err) throw new Error(err)
      })
    }
  }
  unlockChange (e) {
    this.setState({ unlockInput: e.target.value })
  }
  unlockSubmit (e) {
    link.rpc('unlockSigner', this.props.signer.id, this.state.unlockInput, () => {})
  }
  render () {
    let requests = this.store('main.accounts', this.props.id, 'requests') || {}
    requests = Object.keys(requests).map(key => requests[key])
    // .filter(req => {
    //   if (req.type === 'transaction') return this.props.addresses.map(a => a.toLowerCase()).indexOf(req && req.data ? req.data.from.toLowerCase() : null) > -1
    //   return true
    // })
    // transitionName='slideUp' transitionEnterTimeout={960} transitionLeaveTimeout={640}
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

    let current = (this.store('selected.current') === this.props.id) && this.props.status === 'ok'
    let open = current && this.store('selected.open')
    // let minimized = this.store('selected.minimized')

    return (
      <div className={this.store('selected.view') === 'default' ? 'signerRequests' : 'signerRequests signerRequestsHidden'}>
        <div className='signerUnlockRequest' style={open && this.props.signer && this.props.signer.status === 'locked' ? { opacity: 1, height: '100px', transfrom: 'translateY(0px)' } : { pointerEvents: 'none', transfrom: 'translateY(-200px)', opacity: 0 }}>
          <input className='signerUnlockInput' type='password' value={this.state.unlockInput} onChange={::this.unlockChange} />
          <div className='signerUnlockSubmit' onMouseDown={::this.unlockSubmit} >{'Unlock'}</div>
        </div>
        <div className='requestTitle'>
          <div>{'Requests'}</div>
          <div className='requestCount'>{normal.length}</div>
        </div>
        <div className='requestContainerWrap'>
          <div className='requestContainer' style={{ height: containHeight + 'px' }}>
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
