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

class _RequestItem extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.state = {
      ago: this.getElapsedTime() + ' ago'
    }
    
  }
  getElapsedTime () {
    const elapsed = Date.now() - (this.props.req && this.props.req.created || 0)
    const secs = elapsed / 1000
    const mins = secs / 60
    const hrs = mins / 60
    const days = hrs / 24
    if (days >= 1) return Math.round(days) + 'd'
    if (hrs >= 1) return Math.round(hrs) + 'h'
    if (mins >= 1) return Math.round(mins) + 'm'
    if (secs >= 1) return Math.round(secs) + 's'
    return '0s'
  }
  componentDidMount () {
    this.timer = setInterval(() => {
      this.setState({ ago: this.getElapsedTime() + ' ago' })
    }, 1000)
  }
  componentWillUnmount () {
    clearInterval(this.timer)
  }
  render () {
    const { req, i, title, icon } = this.props
    return (
      <div 
        key={req.handlerId}
        className='requestItem cardShow'
        // style={{ animationDelay: (i * 0.08) + 's' }}
        onClick={() => {
          this.props.setAccountView('requestView', { req, i })
        }}
      >
        <div className='requestItemRow requestItemRowHeader'>
          <div className='requestItemRowIconLarge'>
            {icon}
          </div>
          <div className='requestItemRowTitleLarge'>
            {title}
          </div>
        </div>
        <div className='requestItemRow'>
        <div className='requestItemRowIcon'>
            {svg.window(12)}
          </div>
          <div className='requestItemRowTitle'>
            {this.store('main.origins', req.origin, 'name')}
          </div>
          <div className={'requestItemSource'}>
            {svg.chrome(11)}
            {' chrome'}
          </div>
        </div>
        <div className='requestItemRow'>
          <div className='requestItemRowIcon' style={{ top: 'px' }}>
            {svg.pin(13)}
          </div>
          <div className='requestItemRowTitle'>
            {'pending'}
          </div>
          <div className={this.state.ago.includes('s') ? 'requestItemTime requestItemTimeNew' : 'requestItemTime'}>
            {this.state.ago}
          </div>
        </div>
        <div className='requestItemIcon' />
        {/* <pre>{JSON.stringify(req, null, 2)}</pre> */}
      </div>
    )
  }
}

const RequestItem = Restore.connect(_RequestItem)


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
                return (
                  <RequestItem 
                    req={req} 
                    i={i} 
                    title={'Account Access'} 
                    icon={svg.accounts(20)} 
                    setAccountView={this.props.setAccountView}
                  />
                )
              } else if (req.type === 'sign') {
                return (
                  <RequestItem 
                    req={req}
                    i={i}
                    title={'Sign Message'}
                    icon={svg.sign(20)}
                    setAccountView={this.props.setAccountView}
                  />
                )
              } else if (req.type === 'signTypedData') {
                return (
                  <RequestItem
                    req={req}
                    i={i}
                    title={'Sign Data'} 
                    icon={svg.sign(20)} 
                    setAccountView={this.props.setAccountView}
                  />
                )
              } else if (req.type === 'addChain') { 
                return (
                  <RequestItem 
                    req={req} 
                    i={i} 
                    title={'Add Chain'} 
                    icon={svg.chain(20)} 
                    setAccountView={this.props.setAccountView}
                  />
                )
              } else if (req.type === 'switchChain') {
                return (
                  <RequestItem
                    req={req}
                    i={i}
                    title={'Switch Chain'}
                    icon={svg.chain(20)} 
                    setAccountView={this.props.setAccountView}
                  />
                )
              } else if (req.type === 'addToken')  {
                return (
                  <RequestItem
                    req={req}
                    i={i}
                    title={'Add Tokens'}
                    icon={svg.tokens(20)}
                    setAccountView={this.props.setAccountView}
                  />
                )
              } else if (req.type === 'transaction')  {
                const chainName = this.store('main.networks.ethereum', parseInt(req.data.chainId, 16), 'name') 
                return (
                  <RequestItem 
                    req={req}
                    i={i}
                    title={chainName + ' Transaction'}
                    icon={svg.broadcast(20)}
                    setAccountView={this.props.setAccountView}
                  />
                )
              }
            })}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Requests)
