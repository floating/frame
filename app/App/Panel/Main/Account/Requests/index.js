import React from 'react'
import Restore from 'react-restore'
// import { CSSTransitionGroup } from 'react-transition-group'

import ProviderRequest from './ProviderRequest'
import TransactionRequest from './TransactionRequest'
import SignatureRequest from './SignatureRequest'
import ChainRequest from './ChainRequest'
import AddTokenRequest from './AddTokenRequest'

import link from '../../../../../../resources/link'
import SignTypedDataRequest from './SignTypedDataRequest'

function isHardwareSigner (account = {}) {
  return ['ledger', 'lattice', 'trezor', 'keystone'].includes(account.lastSignerType)
}

class Requests extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.state = {
      minimized: false,
      // unlockInput: '',
      // unlockHeadShake: false
    }
    this.moduleRef = React.createRef()
    this.resizeObserver = new ResizeObserver(() => {
      if (this.moduleRef && this.moduleRef.current) {
        link.send('tray:action', 'updateAccountModule', props._id, { height: this.moduleRef.current.clientHeight })
      }
    })
  }

  // trezorPin (num) {
  //   this.tPin = this.tPin ? this.tPin + num.toString() : num.toString()
  //   if (this.tPin.length === 4) {
  //     link.rpc('trezorPin', this.props.id, this.tPin, (err, status) => {
  //       if (err) throw new Error(err)
  //     })
  //     this.tPin = ''
  //   }
  // }

  minimize () {
    this.setState({ minimized: true })
  }

  // unlockChange (e) {
  //   this.setState({ unlockInput: e.target.value })
  // }

  // unlockSubmit (e) {
  //   link.rpc('unlockSigner', this.props.signer.id, this.state.unlockInput, (err, result) => {
  //     if (err) {
  //       this.setState({ unlockHeadShake: true })
  //       setTimeout(() => this.setState({ unlockHeadShake: false }), 1010)
  //     }
  //   })
  // }

  // keyPressUnlock (e) {
  //   if (e.key === 'Enter') {
  //     e.preventDefault()
  //     this.unlockSubmit()
  //   }
  // }

  componentDidMount () {
    this.resizeObserver.observe(this.moduleRef.current)
    if (this.moduleRef && this.moduleRef.current) {
      link.send('tray:action', 'updateAccountModule', this.props._id, { height: this.moduleRef.current.clientHeight })
    }
    setTimeout(() => {
      const current = (this.store('selected.current') === this.props.id) && this.props.status === 'ok'
      const open = current && this.store('selected.open')
      if (open && this.props.signer && this.unlockInput) {
        const signer = this.store('main.signers', this.props.signer)
        if (signer.status === 'locked') this.unlockInput.current.focus()
      }
    }, 100)
  }

  // componentDidMount () {
    
  //   // link.send('tray:action', 'updateAccountModule', this.props.id, { height: this.moduleRef.current.clientHeight })
  // } 

  render () {
    const activeAccount =  this.store('main.accounts', this.props.id)
    const requests = Object.values(activeAccount.requests || {})
    const signingDelay = isHardwareSigner(activeAccount) ? 200 : 1500

    const normal = requests.filter(req => req.mode === 'normal')
    normal.sort((a, b) => {
      if (a.created > b.created) return -1
      if (a.created < b.created) return 1
      return 0
    })
    const monitor = requests.filter(req => req.mode === 'monitor')
    monitor.sort((a, b) => {
      if (a.created > b.created) return -1
      if (a.created < b.created) return 1
      return 0
    })
    const monitorHeight = 220
    let containNormal = normal.length ? (360 + (normal.length * 6)) : 26
    // if (normal.length && monitor.length > 0) {
    //   containNormal += 50
    // } else if (monitor.length > 0) {
    //   containNormal += 50
    // }
    const containMonitor = (monitor.length * monitorHeight) + 20
    const containHeight = containNormal + containMonitor + 40

    return (
      <div ref={this.moduleRef} className={this.store('selected.view') === 'default' ? 'signerRequests' : 'signerRequests signerRequestsHidden'}>
        {/* <div className='requestTitle'>
          <div>Requests</div>
          <div className='requestCount'>{normal.length}</div>
        </div> */}
        <div className='requestContainerWrap'>
          <div className='requestContainer' style={{ height: containHeight + 'px' }}>
            <div key='noReq' style={normal.length !== 0 ? { opacity: 0, transform: `translateY(50px)`, transition: 'none' } : { transform: `translateY(${monitor.length === 0 ? 10 : 0}px)` }} className='noRequests'>No Pending Requests</div>
            <div className='recentRequests' style={{ opacity: monitor.length > 0 ? 1 : 0, transform: `translateY(${containNormal +  40}px)` }}>
              <span>Recent Transactions</span>
              <span>{monitor.length}</span>
            </div>
            {normal.concat(monitor).map((req, i) => {
              let pos = 0
              const z = 2000 + i
              if (req.mode === 'normal') pos = (((normal.length - 1) - i) * 6) + 36
              if (req.mode === 'monitor') pos = containNormal + 10 + ((i - normal.length) * monitorHeight) + 55
              if (req.type === 'transaction') return <TransactionRequest key={req.handlerId} req={req} pos={pos} z={z} i={i} onTop={i === normal.length - 1} accountId={this.props.id} signingDelay={signingDelay} />
              if (req.type === 'access') return <ProviderRequest key={req.handlerId} req={req} pos={pos} z={z} onTop={i === normal.length - 1} />
              if (req.type === 'sign') return <SignatureRequest key={req.handlerId} req={req} pos={pos} z={z} onTop={i === normal.length - 1} signingDelay={signingDelay} />
              if (req.type === 'signTypedData') return <SignTypedDataRequest key={req.handlerId} req={req} pos={pos} z={z} onTop={i === normal.length - 1} signingDelay={signingDelay} />
              if (req.type === 'addChain' || req.type === 'switchChain') return <ChainRequest key={req.handlerId} req={req} pos={pos} z={z} onTop={i === normal.length - 1} />
              if (req.type === 'addToken') return <AddTokenRequest key={req.handlerId} req={req} pos={pos} z={z} onTop={i === normal.length - 1} />
              return null
            })}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Requests)
