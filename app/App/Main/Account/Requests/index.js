import React from 'react'
import Restore from 'react-restore'
// import { CSSTransitionGroup } from 'react-transition-group'

// import ProviderRequest from './ProviderRequest'
// import TransactionRequest from './TransactionRequest'
// import SignatureRequest from './SignatureRequest'
// import ChainRequest from './ChainRequest'
// import AddTokenRequest from './AddTokenRequest'
// import SignTypedDataRequest from './SignTypedDataRequest'
// function isHardwareSigner (account = {}) {
//   return ['ledger', 'lattice', 'trezor'].includes(account.lastSignerType)
// }

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'

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

  renderRequestItem (req, i, title, icon) {
    return (
      <div 
        key={req.handlerId}
        className='requestItem cardShow'
        // style={{ animationDelay: (i * 0.08) + 's' }}
        onClick={() => {
          this.props.setAccountView('requestView', { req, i })
        }}
      >
        <div className='requestItemIcon'>
          <div className='requestItemIconFrame'>
            {icon}
          </div>
        </div>
        <div className='requestItemTime'>
          {'22m ago'}
        </div>
        <div className='requestItemStatus'>
          {'pending'}
        </div>
        <div className='requestItemOrigin'>
          {/* <div className='requestItemOriginIcon'>
            {svg.nested(10)}
          </div> */}
          
          {this.store('main.origins', req.origin, 'name')}
        </div>
        <div className='requestItemMain'>
          <div className='requestItemTitle'>
            {title}
          </div>
        </div>
        {/* <pre>{JSON.stringify(req, null, 2)}</pre> */}
      </div>
    )
  }

  render () {
    const activeAccount =  this.store('main.accounts', this.props.id)
    const requests = Object.values(activeAccount.requests || {})

    requests.sort((a, b) => {
      if (a.created > b.created) return -1
      if (a.created < b.created) return 1
      return 0
    })

    return (
      <div 
        ref={this.moduleRef} 
        className={this.store('selected.view') === 'default' ? 'signerRequests' : 'signerRequests signerRequestsHidden'}
      >
        <div className='requestContainerWrap'>
          <div className='requestContainer'>
            {!requests.length ? (
              <div key='noReq' className='noRequests'>
                No Pending Requests
              </div>
            ): null}
            {/* <div className='recentRequests' style={{ opacity: monitor.length > 0 ? 1 : 0, transform: `translateY(${containNormal +  40}px)` }}>
              <span>Recent Transactions</span>
              <span>{monitor.length}</span>
            </div> */}
            {requests.map((req, i) => {
              if (req.type === 'access') {
                return this.renderRequestItem(req, i, 'Account Access', svg.accounts(22))
              } else if (req.type === 'sign') {
                return this.renderRequestItem(req, i, 'Sign Message', svg.sign(22))
              } else if (req.type === 'signTypedData') {
                return this.renderRequestItem(req, i, 'Sign Data', svg.sign(22))
              } else if (req.type === 'addChain') { 
                return this.renderRequestItem(req, i, 'Add Chain', svg.chain(22))
              } else if (req.type === 'switchChain') {
                return this.renderRequestItem(req, i, 'Switch Chain', svg.chain(22))
              } else if (req.type === 'addToken')  {
                return this.renderRequestItem(req, i, 'Add Tokens', svg.tokens(22))
              } else if (req.type === 'transaction')  {
                return this.renderRequestItem(req, i, req.data.chainId + ' Transaction', svg.broadcast(22))
              }
            })}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Requests)
