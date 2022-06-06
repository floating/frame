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

import RingIcon from '../../../../../resources/Components/RingIcon'
import chainMeta from '../../../../../resources/chainMeta'

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
    const { account, handlerId, i, title, svgLookup, img, color } = this.props
    const req = this.store('main.accounts', account, 'requests', handlerId)
    return (
      <div 
        key={req.handlerId}
        className='requestItem cardShow'
        // style={{ animationDelay: (i * 0.08) + 's' }}
        onClick={() => {
          this.props.setAccountView('requestView', { account, req, i })
        }}
      >
        <div className='requestItemTitle'>
          <div className='requestItemIcon'>
            <RingIcon 
              color={color}
              svgLookup={svgLookup}
              img={img}
            />
          </div>
          <div className='requestItemMain'>
            <div className='requestItemTitleMain'>
              {title}
            </div>
            <div className='requestItemTitleSub'>
              <div 
                className='requestItemTitleSubIcon'
              >
                {svg.window(10)}
              </div>
              <div className='requestItemTitleSubText'>
                {this.store('main.origins', req.origin, 'name')}
              </div>
            </div>
            {req.recipient ? (
              <div className='requestItemTitleSub'>
                <div 
                  className='requestItemTitleSubIcon'
                >
                  {svg.send(9)}
                </div>
                <div className='requestItemTitleSubText'>
                  {req.recipient}
                </div>
              </div>
            ) : null}
          </div>
          <div className='requestItemTitleTime'>
            <div className='requestItemTitleTimeItem'>
              {this.state.ago}
            </div>
          </div>
        </div>
        <div className='requestItemDetails'>
          <div className='requestItemDetailsSlide'>
            <div className='requestItemDetailsIndicator' />
            {req.status || 'pending'}
          </div>
        </div>
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
                    account={this.props.id}
                    handlerId={req.handlerId}
                    i={i}
                    title={'Account Access'} 
                    color={'var(--outerspace)'}
                    svgLookup={{ name: 'accounts', size: 16 }}
                    setAccountView={this.props.setAccountView}
                  />
                )
              } else if (req.type === 'sign') {
                return (
                  <RequestItem 
                    req={req}
                    account={this.props.id}
                    handlerId={req.handlerId}
                    i={i}
                    title={'Sign Message'}
                    color={'var(--outerspace)'}
                    svgLookup={{ name: 'sign', size: 16 }}
                    setAccountView={this.props.setAccountView}
                  />
                )
              } else if (req.type === 'signTypedData') {
                return (
                  <RequestItem
                    req={req}
                    account={this.props.id}
                    handlerId={req.handlerId}
                    i={i}
                    title={'Sign Data'} 
                    color={'var(--outerspace)'}
                    svgLookup={{ name: 'sign', size: 16 }}
                    setAccountView={this.props.setAccountView}
                  />
                )
              } else if (req.type === 'addChain') { 
                return (
                  <RequestItem 
                    req={req} 
                    account={this.props.id}
                    handlerId={req.handlerId}
                    i={i} 
                    title={'Add Chain'} 
                    color={'var(--outerspace)'}
                    svgLookup={{ name: 'chain', size: 16 }}
                    setAccountView={this.props.setAccountView}
                  />
                )
              } else if (req.type === 'switchChain') {
                return (
                  <RequestItem
                    req={req}
                    account={this.props.id}
                    handlerId={req.handlerId}
                    i={i}
                    title={'Switch Chain'}
                    color={'var(--outerspace)'}
                    svgLookup={{ name: 'chain', size: 16 }}
                    setAccountView={this.props.setAccountView}
                  />
                )
              } else if (req.type === 'addToken')  {
                return (
                  <RequestItem
                    req={req}
                    account={this.props.id}
                    handlerId={req.handlerId}
                    i={i}
                    title={'Add Tokens'}
                    color={'var(--outerspace)'}
                    svgLookup={{ name: 'tokens', size: 16 }}
                    setAccountView={this.props.setAccountView}
                  />
                )
              } else if (req.type === 'transaction')  {
                const chainName = this.store('main.networks.ethereum', parseInt(req.data.chainId, 16), 'name') 
                const hexId = req.data.chainId
                chainMeta[hexId] ? chainMeta[hexId].primaryColor : ''
                chainMeta[hexId] ? chainMeta[hexId].icon : ''
                
                return (
                  <RequestItem 
                    req={req}
                    account={this.props.id}
                    handlerId={req.handlerId}
                    i={i}
                    title={chainName + ' Transaction'}
                    color={chainMeta[hexId] ? chainMeta[hexId].primaryColor : ''}
                    img={chainMeta[hexId] ? chainMeta[hexId].icon : ''}
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
