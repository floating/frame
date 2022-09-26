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

import RequestItem from '../../../../../resources/Components/RequestItem'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import chainIcons from '../../../../../resources/chainIcons'

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
        className='balancesBlock'
      >
        <div className={'moduleHeader'}>
          <span>{svg.inbox(13)}</span>
          <span>{'Requests'}</span>
        </div>
        <div className='requestContainerWrap'>
          <div className='requestContainer'>
            {!requests.length ? (
              <div key='noReq' className='noRequests'>
                No Pending Requests
              </div>
            ) : null}
            {requests.map((req, i) => {
              if (req.type === 'access') {
                return (
                  <RequestItem
                    key={req.type + i}
                    req={req} 
                    account={this.props.id}
                    handlerId={req.handlerId}
                    i={i}
                    title={'Account Access'} 
                    color={'var(--outerspace)'}
                    svgLookup={{ name: 'accounts', size: 16 }}
                  />
                )
              } else if (req.type === 'sign') {
                return (
                  <RequestItem 
                    key={req.type + i}
                    req={req}
                    account={this.props.id}
                    handlerId={req.handlerId}
                    i={i}
                    title={'Sign Message'}
                    color={'var(--outerspace)'}
                    svgLookup={{ name: 'sign', size: 16 }}
                  />
                )
              } else if (req.type === 'signTypedData') {
                return (
                  <RequestItem
                    key={req.type + i}
                    req={req}
                    account={this.props.id}
                    handlerId={req.handlerId}
                    i={i}
                    title={'Sign Data'} 
                    color={'var(--outerspace)'}
                    svgLookup={{ name: 'sign', size: 16 }}
                  />
                )
              } else if (req.type === 'addChain') { 
                return (
                  <RequestItem 
                    key={req.type + i}
                    req={req} 
                    account={this.props.id}
                    handlerId={req.handlerId}
                    i={i} 
                    title={'Add Chain'} 
                    color={'var(--outerspace)'}
                    svgLookup={{ name: 'chain', size: 16 }}
                  />
                )
              } else if (req.type === 'switchChain') {
                return (
                  <RequestItem
                    key={req.type + i}
                    req={req}
                    account={this.props.id}
                    handlerId={req.handlerId}
                    i={i}
                    title={'Switch Chain'}
                    color={'var(--outerspace)'}
                    svgLookup={{ name: 'chain', size: 16 }}
                  />
                )
              } else if (req.type === 'addToken')  {
                return (
                  <RequestItem
                    key={req.type + i}
                    req={req}
                    account={this.props.id}
                    handlerId={req.handlerId}
                    i={i}
                    title={'Add Tokens'}
                    color={'var(--outerspace)'}
                    svgLookup={{ name: 'tokens', size: 16 }}
                  />
                )
              } else if (req.type === 'transaction')  {
                const chainId = parseInt(req.data.chainId, 16)
                const chainName = this.store('main.networks.ethereum', chainId, 'name') 
                const chainColor = this.store('main.networksMeta.ethereum', chainId, 'primaryColor')
                
                return (
                  <RequestItem 
                    key={req.type + i}
                    req={req}
                    account={this.props.id}
                    handlerId={req.handlerId}
                    i={i}
                    title={`${chainName} Transaction`}
                    color={chainColor ? `var(--${chainColor})`: ''}
                    img={chainIcons(chainName)}
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
