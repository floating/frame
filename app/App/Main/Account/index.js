import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../resources/svg'
import link from '../../../../resources/link'

import Default from './Default'

import Activity from './Activity'
import Balances from './Balances'
import Gas from './Gas'
import Inventory from './Inventory'
import Launcher from './Launcher'
import Permissions from './Permissions'
import Requests from './Requests'
// import SignerModule from './Signer'
import SignerStatus from './SignerStatus'
import Verify from './Verify'
import Settings from './Settings'


// move 
import ProviderRequest from './Requests/ProviderRequest'
import TransactionRequest from './Requests/TransactionRequest'
import SignatureRequest from './Requests/SignatureRequest'
import ChainRequest from './Requests/ChainRequest'
import AddTokenRequest from './Requests/AddTokenRequest'
import SignTypedDataRequest from './Requests/SignTypedDataRequest'


// class _Verify extends React.Component {
//   constructor (props, context) {
//     super(props, context)
//     this.moduleRef = React.createRef()
//     this.resizeObserver = new ResizeObserver(() => {
//       if (this.moduleRef && this.moduleRef.current) {
//         link.send('tray:action', 'updateAccountModule', props.id, { height: this.moduleRef.current.clientHeight })
//       }
//     })
//     this.state = {
//       verifyAddressSuccess: false,
//       verifyAddressResponse: ''
//     }
//   }
//   componentDidMount () {
//     this.resizeObserver.observe(this.moduleRef.current)
//     link.send('tray:action', 'updateAccountModule', this.props.id, { height: this.moduleRef.current.clientHeight })
//   } 
//   render () {
//     // console.log(this.props)
//     // const { module, index } = this.props
//     // const { top, height } = module
//     // const style = { transform: `translateY(${top}px)`, zIndex: 10000 - index, height }
//     // const i = 1
//     // const transform = viewIndex === i ? 'translateX(0)' : viewIndex > i ? 'translateX(-100%)' : 'translateX(100%)'
//     const signerType = this.store('main.accounts', this.props.id, 'signer.type')
//     const signerKind = (signerType === 'seed' || signerType === 'ring') ? 'hot' : 'device'
//     return (
//       <div ref={this.moduleRef} style={{ padding: '20px' }}>
//         <div className='signerSettingsTitle'>Verify Address</div>
//         <div className='signerPermission'>
//           <div className='signerVerifyText'>Verify that the address displayed in Frame is correct</div>
//           {this.state.verifyAddressResponse ? (
//             <div className={this.state.verifyAddressSuccess ? 'signerVerifyResponse signerVerifyResponseSuccess' : 'signerVerifyResponse'}>{this.state.verifyAddressResponse}</div>
//           ) : null}
//         </div>
//         <div className='quitFrame'>
//           <div onMouseDown={() => this.verifyAddress()} className='quitFrameButton'>{signerKind === 'hot' ? 'Verify Address' : 'Verify Address on Device'}</div>
//         </div>
//       </div>
//     )

//   }
// }

// const Verify = Restore.connect(_Verify)


// class Module extends React.Component {
//   constructor (props, context) {
//     super(props, context)
//     this.moduleRef = React.createRef()
//     this.resizeObserver = new ResizeObserver(() => {
//       if (this.moduleRef && this.moduleRef.current) {
//         link.send('tray:action', 'updateAccountModule', props.id, { height: this.moduleRef.current.clientHeight })
//       }
//     })
//   }
//   componentDidMount () {
//     this.resizeObserver.observe(this.moduleRef.current)
//     // if (this.moduleRef && this.moduleRef.current) {
//     //   link.send('tray:action', 'updateAccountModule', this.props.id, { height: this.moduleRef.current.clientHeight })
//     // }
//     // link.send('tray:action', 'updateAccountModule', this.props.id, { height: this.moduleRef.current.clientHeight })
//   } 
//   // componentWillUnmount () {
//   //   this.props.unregisterModule(this.props.index, this.moduleRef)
//   // }
//   render () {
//     // console.log(this.props)
//     // const { module, index } = this.props
//     // const { top, height } = module
//     // const style = { transform: `translateY(${top}px)`, zIndex: 10000 - index, height }
//     return (
//       <div ref={this.moduleRef}>
//         <div className='moduleHeader'>{this.props.id}</div>
//         <div className='moduleMain'>
//           <div className='cardShow'>{`Account Module line }`}</div>
//         </div>
//       </div>
//     )
//   }
// }

// class Activity extends Module {
//   render (

//   )
// }

// const { SignerModule } = modules


// import React from 'react'
// import Restore from 'react-restore'
// import link from '../../../../../../../resources/link'

// account module is position absolute and with a translateX 
class _AccountMain extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      expandedModule: ''
    }
  }
  // constructor (props, context) {
  //   // console.log(context)
  //   super(props, context)
  //   // this.resizeObserver = new ResizeObserver(() => )
  //   this.state = { 
  //     slideHeight: 0
  //   }
  //   // this.moduleRefs = []
  //   context.store.observer(() => { 
  //     const modules = context.store('views.tray.account.defaultModules') // modules per account in future
  //     // Make refs
  //     if (this.moduleRefs.length < modules.length) {
  //       this.resizeObserver.disconnect()
  //       this.moduleRefs = modules.map(() => React.createRef())
  //     }
  //   })
    
  // }
  // componentDidMount () {

  // }
  // reportModule () {

  // }
  // computePositions () {
  //   this.resizeObserver.disconnect()
  //   const modulePositions = []
  //   let slideHeight = 0
  //   this.moduleRefs.forEach((ref, i) => {
  //     modulePositions[i] = {}
  //     modulePositions[i].top = slideHeight
  //     modulePositions[i].height = ref && ref.current ? ref.current.clientHeight + 1 : 0
  //     slideHeight += modulePositions[i].height
  //   })
  // }
  renderModule (id, module, top, index, expandModule, expanded, expandedData) {
    // console.log(id, module, top, index)
    let hidden = false
    let style = { 
      transform: `translateY(${top}px)`, 
      zIndex: 10000 - index, 
      height: module.height,
      opacity: 1
    }
    //  && !this.props.signer) hidden = true
    if (hidden) {
      style = { 
        transform: `translateY(${top}px)`, 
        zIndex: 10000 - index, 
        height: 0,
        opacity: 0,
        overflow: 'hidden'
      }
    }

    let moduleClass = ''
    if (id === 'requests') moduleClass = ' transparentModule'

    return (
      <div className={'accountModule' + moduleClass} style={style}>
        <div className='accountModuleInner cardShow' style={{ animationDelay: (index * 0.1) + 's'}}>
          {
            id === 'gas' ? <Gas 
              moduleId={id} 
              id={this.props.id}
              expandModule={expandModule}
              expanded={expanded}
            /> :
            id === 'requests' ? <Requests 
              _id={id}
              id={this.props.id}
              setAccountView={this.props.setAccountView}
              addresses={this.props.addresses} 
              minimized={this.props.minimized} 
              status={this.props.status} 
              signer={this.props.signer} 
              expandModule={expandModule}
              expanded={expanded}
            /> :
            id === 'verify' ? <Verify 
              moduleId={id}
              id={this.props.id}
              expandModule={expandModule}
              expanded={expanded}
            /> :
            id === 'activity' ? <Activity 
              moduleId={id} 
              id={this.props.id}
              expandModule={expandModule}
              expanded={expanded}
            /> :
            id === 'launcher' ? <Launcher 
              moduleId={id}
              id={this.props.id} 
              expandModule={expandModule}
              expanded={expanded}
            /> :
            id === 'inventory' ? <Inventory 
              moduleId={id} 
              id={this.props.id}
              expandModule={expandModule}
              expanded={expanded}
              expandedData={expandedData}
            /> :
            id === 'permissions' ? <Permissions
              moduleId={id}
              id={this.props.id}
              expandModule={expandModule}
              expanded={expanded}
            /> :
            id === 'balances' ? <Balances
              moduleId={id} 
              {...this.props}
              expandModule={expandModule}
              expanded={expanded}
            /> :
            id === 'settings' ? <Settings
              moduleId={id}
              id={this.props.id}
              expandModule={expandModule}
              expanded={expanded}
            /> :
            <Default 
              moduleId={id}
              expandModule={expandModule}
              expanded={expanded}
            />
          }
        </div>  
      </div>
    )
  }
  expandModule (id, data) {
    this.setState({ expandedModule: id, expandedModuleData: data || {} }) 
  }
  render () {
    const accountModules = this.store('panel.account.modules')
    const accountModuleOrder = this.store('panel.account.moduleOrder')
    let slideHeight = 0
    const modules = accountModuleOrder.map((id, i) => {
      const module = accountModules[id] || { height: 0 }
      slideHeight += module.height + 7
      return this.renderModule(
        id, 
        module, 
        slideHeight - module.height - 5, 
        i, 
        this.expandModule.bind(this)
      )
    })
    return (
      <div className='accountMain'>
        {this.state.expandedModule ? (
          <div 
            className='accountsModuleExpand cardShow' 
            style={{ pointerEvents: this.state.expandedModule ? 'auto' : 'none' }}
            onMouseDown={() => this.setState({ expandedModule: false })}
          >
            <div className='moduleExpanded' onMouseDown={(e) => {
              e.stopPropagation()
            }}>
              {this.renderModule(
                this.state.expandedModule, 
                { height: '100%' }, 
                0, 
                0, 
                this.expandModule.bind(this), 
                true,
                this.state.expandedModuleData
              )}
            </div>
          </div>
        ) : null}
        <div className='accountMainScroll' style={{ pointerEvents: this.state.expandedModule ? 'none' : 'auto' }}>
          <div className='accountMainSlide' style={{ height: slideHeight + 21 + 'px' }}>
            {modules}
          </div>
        </div>
      </div>
    )
  }
}

const AccountMain = Restore.connect(_AccountMain)


// AccountView is a reusable template that provides the option to nav back to main
class _AccountView extends React.Component {
  render () {
    return (
      <div className='accountView'>
        <div className='accountViewMenu cardShow'>
          <div 
            className='accountViewBack'
            onClick={() => this.props.back()}
          >
            {svg.chevronLeft(13)}
          </div>
          <div className='accountViewTitle'>
            <div className='accountViewIcon'>
              {this.props.accountViewIcon}
            </div>
            <div className='accountViewText'>
              {this.props.accountViewTitle}
            </div>
          </div>
        </div>
        <div className='accountViewMain cardShow'>
          {this.props.children}
        </div>
      </div>
    )
  }
}

const AccountView = Restore.connect(_AccountView)

function isHardwareSigner (account = {}) {
  return ['ledger', 'lattice', 'trezor'].includes(account.lastSignerType)
}

class _AccountBody extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      view: 'request'
    }
  } 
  renderRequest (req, i) {
    const activeAccount =  this.store('main.accounts', this.props.id)
    const signingDelay = isHardwareSigner(activeAccount) ? 200 : 1500

    if (req.type === 'transaction') {
      return (
        <TransactionRequest 
          key={req.handlerId}
          req={req}
          handlerId={req.handlerId}
          accountId={this.props.id}
          signingDelay={signingDelay} 
        />
      )
    } else if (req.type === 'access') {
      return (
        <ProviderRequest 
          key={req.handlerId} 
          handlerId={req.handlerId}
          accountId={this.props.id}
          req={req} 
        />
      )
    } else if (req.type === 'sign') {
      return (
        <SignatureRequest 
          key={req.handlerId} 
          req={req} 
          handlerId={req.handlerId}
          accountId={this.props.id}
          signingDelay={signingDelay} 
        />
      )
    } else if (req.type === 'signTypedData') {
      return (
        <SignTypedDataRequest
          key={req.handlerId}
          req={req}
          handlerId={req.handlerId}
          accountId={this.props.id}
          signingDelay={signingDelay}
        />
      )
    } else if (req.type === 'addChain' || req.type === 'switchChain') {
      return (
        <ChainRequest 
          key={req.handlerId} 
          req={req} 
          handlerId={req.handlerId}
          accountId={this.props.id}
        />
      )
    } else if (req.type === 'addToken') {
      return (
        <AddTokenRequest
          key={req.handlerId}
          req={req} 
          handlerId={req.handlerId}
          accountId={this.props.id}
        />
      )
    } else {
      return null
    }
  }
  render () {
    const { view, data } = this.store('panel.nav')[0] || {}
    if (view === 'requestView') {
      const { req, i } = data
      let accountViewTitle, accountViewIcon
      if (req.type === 'access') {
        accountViewTitle = 'Account Access'
        accountViewIcon = svg.accounts(17)
      } else if (req.type === 'sign') {
        accountViewTitle = 'Sign Message'
        accountViewIcon = svg.sign(17)
      } else if (req.type === 'signTypedData') {
        accountViewTitle = 'Sign Data'
        accountViewIcon = svg.sign(17)
      } else if (req.type === 'addChain') { 
        accountViewTitle = 'Add Chain'
        accountViewIcon = svg.chain(17)
      } else if (req.type === 'switchChain') {
        accountViewTitle = 'Switch Chain'
        accountViewIcon = svg.chain(17)
      } else if (req.type === 'addToken')  {
        accountViewTitle = 'Add Token'
        accountViewIcon = svg.tokens(17)
      } else if (req.type === 'transaction')  {
        accountViewTitle = 'Sign Transaction'
        accountViewIcon = svg.broadcast(17)
      }
      return (
        <AccountView 
          back={() => {
            link.send('tray:action', 'backPanel', { view, data })
          }}
          {...this.props}
          accountViewTitle={accountViewTitle}
          accountViewIcon={accountViewIcon}
        >
          {this.renderRequest(req, i)}
        </AccountView>
      )
    } else if (view === 'expandedModule') {
      return (
        <AccountView {...props}>
          <div 
            className='accountsModuleExpand cardShow' 
            style={{ pointerEvents: this.state.expandedModule ? 'auto' : 'none' }}
            onMouseDown={() => this.setState({ expandedModule: false })}
          >
            <div className='moduleExpanded' onMouseDown={(e) => {
              e.stopPropagation()
            }}>
              {this.renderModule(
                this.state.expandedModule, 
                { height: '100%' }, 
                0, 
                0, 
                this.expandModule.bind(this), 
                true,
                this.state.expandedModuleData
              )}
            </div>
          </div>
        </AccountView>
      )
    } else {
      return (
        <AccountMain 
          setAccountView={(view, data) => {
            link.send('tray:action', 'navPanel', { view, data })
            // this.setState({ view, data })
          }} 
          {...this.props} 
        />
      )
    }
  }
}


const AccountBody = Restore.connect(_AccountBody)

// 


{/* <Module 
index={0}
registerModule={this.registerModule.bind(this)}
module={this.state.modules[0] || { index: 0, top: 0 }}
>
<div className='accountModuleContent'>
  {lines.map((i) => {
    return (
      <div className='cardShow'>{`Account Module: ${0} - Line: ${i}`}</div>
    )
  })}
</div>
</Module>
<Module 
index={1}
registerModule={this.registerModule.bind(this)}
module={this.state.modules[1] || { index: 1, top: 0 }}
>
<div className='accountModuleContent'>
  {`Account Module: ${1}`}
</div>
</Module>
<Module
index={2}
registerModule={this.registerModule.bind(this)}
module={this.state.modules[2] || { index: 2, top: 0 }}
// removeModule={this.registerModule.bind(this)}
>
<div className='accountModuleContent'>
  {`Account Module: ${2}`}
</div>
</Module>
<Module 
index={3}
registerModule={this.registerModule.bind(this)}
module={this.state.modules[3] || { index: 3, top: 0 }}

>
<div className='accountModuleContent'>
  {`Account Module: ${3}`}
</div>
</Module>
<Module 
index={4}
registerModule={this.registerModule.bind(this)}
module={this.state.modules[4] || { index: 4, top: 0 }}
>
<div className='accountModuleContent'>
  {`Account Module: ${4}`}
</div>
</Module>
<Module 
index={5}
registerModule={this.registerModule.bind(this)}
module={this.state.modules[5] || { index: 5, top: 0 }}
>
<div className='accountModuleContent'>
  {`Account Module: ${5}`}
</div>
</Module> */}


// TODO: Rename Signer component to Account

// class _Balances extends React.Component {
//   constructor (...args) {
//     super(...args)
//     this.moduleRef = React.createRef()
//     this.state = {
//       openActive: false,
//       open: false,
//       selected: 0,
//       shadowTop: 0
//     }
//     this.mD = this.mouseDetect.bind(this)
//   }

//   mouseDetect (e) {
//     if (this.moduleRef && this.moduleRef.current && !this.moduleRef.current.contains(e.target)) {
//       this.setActive(false)
//     }
//   }

//   setActive (active) {
//     if (type !== 'ethereum' || id !== '1') return
//     this.setState({ openActive: active })
//     this.openTimer = setTimeout(() => this.setState({ open: active }), 480)
//     if (active && !this.state.openActive) {
//       this.store.clickGuard(true)
//       document.addEventListener('mousedown', this.mD)
//     } else {
//       this.store.clickGuard(false)
//       document.removeEventListener('mousedown', this.mD)
//     }
//   }

//   handleScroll (event) {
//     this.setState({ shadowTop: event.target.scrollTop })
//   }

//   renderBalance (known, k, i) {
//     const currentIndex = this.store('main.accounts', this.props.id, 'index')
//     const address = this.store('main.accounts', this.props.id, 'addresses', currentIndex)
//     const balance = this.store('balances', address)
//     const token = known[k]
//     return (
//       <div className='signerBalance' key={k} onMouseDown={() => this.setState({ selected: i })}>
//         <div className='signerBalanceLogo'>
//           <img src={token.logoURI} />
//         </div>
//         <div className='signerBalanceCurrency'>
//           {token.symbol}
//         </div>
//         <div className='signerBalanceValue' style={(token.displayBalance || '$0').length >= 12 ? { fontSize: '15px', top: '14px' } : {}}>
//           {(balance === undefined ? '-.------' : token.displayBalance)}
//         </div>
//         <div className='signerBalanceEquivalent' style={(token.usdDisplayValue || '$0').length >= 11 ? { fontSize: '10px', top: '15px' } : {}}>
//           {token.usdDisplayValue}
//         </div>
//       </div>
//     )
//   }

//   render () {
//     const { open, openActive, selected, shadowTop } = this.state
//     let currentIndex = this.store('main.accounts', this.props.id, 'index')
//     if (this.props.accountHighlight === 'active') currentIndex = this.props.highlightIndex
//     const address = this.store('main.accounts', this.props.id, 'addresses', currentIndex)
//     const current = (this.store('selected.current') === this.props.id) && this.props.status === 'ok'
//     const currentSymbol = this.store('main.networks', type, id, 'symbol') || 'ETH'
//     if (current) {
//       const balance = this.store('balances', address)
//       const tokens = this.store('main.accounts', address, 'tokens') || {}
//       const etherRates = this.store('main.rates')
//       const etherUSD = etherRates && etherRates.USD ? parseFloat(etherRates.USD) : 0
//       const known = Object.assign({}, tokens.known, {
//         default: {
//           chainId: 1,
//           name: 'Ether',
//           decimals: 18,
//           address: '0x',
//           logoURI: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png?1595348880',
//           symbol: currentSymbol,
//           balance,
//           displayBalance: balance === undefined ? '-.------' : '' + parseFloat(balance).toFixed(6).toLocaleString(),
//           floatBalance: parseFloat(balance || 0).toFixed(6),
//           usdRate: etherUSD,
//           usdValue: Math.floor(parseFloat(balance) * etherUSD),
//           usdDisplayValue: '$' + Math.floor(parseFloat(balance) * etherUSD).toLocaleString()
//         }
//       })
//       const knownList = Object.keys(known).sort((a, b) => {
//         if (a === 'default') return -1
//         if (b === 'default') return 1
//         return known[a].usdValue > known[b].usdValue ? -1 : known[a].usdValue < known[b].usdValue ? 1 : 0
//       })
//       const offsetTop = (selected * 47) + 10
//       return (
//         <div
//           ref={this.moduleRef} className={openActive ? 'signerBalances signerBalancesOpen' : 'signerBalances'} onMouseDown={() => {
//             clearTimeout(this.openTimer)
//             const o = !this.state.open
//             this.setActive(o)
//           }}
//         >
//           <div
//             className='signerBalanceSliderInset signerBalanceSliderDisplay' style={openActive && !open ? {
//               transition: '0.16s cubic-bezier(.82,0,.12,1) all',
//               transform: `translateY(-${shadowTop}px)`
//             } : openActive && open ? {
//               transition: '0s cubic-bezier(.82,0,.12,1) all',
//               transform: `translateY(-${shadowTop}px)`
//             } : {
//               transition: '0.16s cubic-bezier(.82,0,.12,1) all',
//               transform: `translateY(-${offsetTop}px)`
//             }}
//           >
//             {knownList.map((k, i) => this.renderBalance(known, k, i))}
//           </div>
//           <div className='signerBalanceSlider' style={!open ? { pointerEvents: 'none' } : {}} onScroll={this.handleScroll.bind(this)}>
//             <div className='signerBalanceSliderInset signerBalanceSliderShadow'>
//               {knownList.map((k, i) => this.renderBalance(known, k, i))}
//             </div>
//           </div>
//           <div className='signerBalanceTotal' onMouseDown={(e) => e.stopPropagation()}>
//             <div className='signerBalanceTotalText'>
//               <div className='signerBalanceTotalTitle'>
//                 Total
//               </div>
//               <div className='signerBalanceTotalValue'>
//                 {'$' + knownList.map(k => known[k].usdValue).reduce((a, b) => a + b, 0).toLocaleString()}
//               </div>
//             </div>
//           </div>
//           {knownList.length <= 1 ? (
//             <div className='signerBalanceNoTokens'>
//               No other token balances found
//             </div>
//           ) : null}
//         </div>
//       )
//     } else {
//       return null
//     }
//   }
// }
/// const Balances = Restore.connect(_Balances)

class Account extends React.Component {
  constructor (...args) {
    super(...args)
    this.locked = false
    this.state = {
      typeHover: false,
      accountHighlight: 'default',
      highlightIndex: 0,
      unlockInput: '',
      openHover: false,
      addressHover: false,
      hideSignerStatus: true
    }
  }

  componentDidMount () {
    if (this.props.index === 0) this.props.resetScroll()
    window.addEventListener('scroll', this.onScroll.bind(this), true)
  }

  componentWillUnmount () {
    window.removeEventListener('scroll', this.onScroll.bind(this), true)
  }
  
  onScroll () {
    this.setState({ addressHover: false}) 
  }

  copyAddress () {
    link.send('tray:clipboardData', this.props.id)
    this.setState({ copied: true })
    setTimeout(_ => this.setState({ copied: false }), 1000)
  }

  unlockChange (e) {
    this.setState({ unlockInput: e.target.value })
  }

  unlockSubmit (e) {
    link.rpc('unlockSigner', this.props.id, this.state.unlockInput, () => {})
  }

  trezorPin (num) {
    this.setState({ tPin: this.state.tPin + num.toString() })
  }

  submitPin () {
    link.rpc('trezorPin', this.props.id, this.state.tPin, () => {})
    this.setState({ tPin: '' })
  }

  backspacePin (e) {
    e.stopPropagation()
    this.setState({ tPin: this.state.tPin ? this.state.tPin.slice(0, -1) : '' })
  }

  select () {
    if (this.store('selected.current') === this.props.id) {
      link.rpc('unsetSigner', this.props.id, (err, status) => { if (err) return console.log(err) })
      if (this.props.signer && this.store('main.accountCloseLock')) link.rpc('lockSigner', this.props.signer, (err, status) => { if (err) return console.log(err) })
    } else {
      const bounds = this.signer.getBoundingClientRect()
      this.props.reportScroll()
      this.store.initialSignerPos({ top: bounds.top - 80, bottom: document.body.clientHeight - bounds.top - this.signer.clientHeight + 3, height: this.signer.clientHeight, index: this.props.index })
      link.rpc('setSigner', this.props.id, (err, status) => { if (err) return console.log(err) })
    }
  }

  renderTrezorPin (active) {
    return (
      <div className='trezorPinWrap' style={active ? {} : { height: '0px', padding: '0px 0px 0px 0px' }}>
        <div className='trezorPinInput'>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <div key={i} className='trezorPinInputButton' onMouseDown={this.trezorPin.bind(this, i)}>
              {svg.octicon('primitive-dot', { height: 20 })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  typeClick () {
    if (this.props.status === 'ok') {
      this.select()
      this.setState({ typeActive: true })
      setTimeout(() => this.setState({ typeActive: false }), 110)
      setTimeout(() => this.setState({ hideSignerStatus: false }), 800)
    } else {
      this.setState({ typeShake: true, hideSignerStatus: true })
      setTimeout(() => this.setState({ typeShake: false }), 1010)
    }
  }

  renderSignerIndicator () {
    let accountIndicatorClass = 'accountIndicator'
    if (this.props.signer) {
      const signer = this.store('main.signers', this.props.signer) || {}
      if (signer.status === 'locked') {
        accountIndicatorClass += ' accountIndicatorLocked'
      } else if (signer.status === 'ok') {
        accountIndicatorClass += ' accountIndicatorGood'
      }
    } else if (this.props.smart) {
      const actingAccount = this.store('main.accounts', this.props.smart.actor)
      if (!actingAccount) return
      const actingSigner = this.store('main.signers', actingAccount.signer)
      if (!actingSigner) return
      if (actingSigner.status === 'locked') {
        accountIndicatorClass += ' accountIndicatorLocked'
      } else if (actingSigner.status === 'ok') {
        accountIndicatorClass += ' accountIndicatorGood'
      }
    }
    return <div className={accountIndicatorClass} />  
  }

  renderType () {
    // let innerClass = 'signerInner'
    // if (this.state.typeActive) innerClass += ' signerInnerActive'
    if (this.state.typeShake) innerClass += ' headShake'
    if (this.store('selected.view') === 'settings') innerClass += ' signerTypeSettings'
    // if (!this.props.signer || (this.props.signer && this.props.signer.status === 'initial')) innerClass += ' signerInnerDisconnected'
    // const inSettings = this.store('selected.view') === 'settings'
    return (
      <div className='signerType' onMouseDown={() => {
        this.hideSignerStatus(!this.state.hideSignerStatus)
      }}>
        {/* {!this.props.signer || (this.props.signer && this.props.signer.status === 'initial') ? (
          <div className='signerTypeDisconnected' onMouseDown={this.typeClick.bind(this)} style={inSettings ? { transform: 'translateY(-30px)' } : {}} onMouseEnter={() => this.setState({ openHover: true })} onMouseLeave={() => this.setState({ openHover: false })}>
            <div className='signerTypeDisconnectedImageFront'>{svg.logo(24)}</div>
          </div>
        ) : null} */}
        {(_ => {
          const type = this.props.lastSignerType 
          if (type === 'ledger') return <div className='signerSelectIconWrap signerIconLedger'>{svg.ledger(20)}</div>
          if (type === 'trezor') return <div className='signerSelectIconWrap signerIconTrezor'>{svg.trezor(20)}</div>
          if (type === 'seed' || type === 'ring') return <div className='signerSelectIconWrap signerIconHot'>{svg.flame(24)}</div>
          if (type === 'aragon') return <div className='signerSelectIconWrap signerIconSmart'>{svg.aragon(28)}</div>
          if (type === 'lattice') return <div className='signerSelectIconWrap signerIconSmart'>{svg.lattice(22)}</div>
          return <div className='signerSelectIconWrap'>{svg.logo(20)}</div>
        })()}
        {/* this.props.signer ? (
          this.store('main.signers', this.props.signer, 'status') === 'locked' ? (
            <div className='signerTypeStatusBadge signerTypeStatusBadgeLocked'>{svg.lock(8)}</div>
          ) : null
        ) : (
          <div className='signerTypeStatusBadge signerTypeStatusBadgeDisconnected'>{svg.plug(10)}</div>
        )*/}
      </div>
    )
  }

  renderMenu () {
    let menuClass = 'signerMenu'
    menuClass += this.store('selected.view') === 'settings' ? ' signerMenuSettings' : ' signerMenuDefault'
    if (this.store('selected.current') === this.props.id & this.store('selected.open')) menuClass += ' signerMenuOpen'
    return (
      <div className={menuClass}>
        <div className='signerMenuItem signerMenuItemLeft' onMouseDown={() => this.store.setSignerView('default')}>
          <div className='signerMenuItemIcon'>
            {svg.octicon('pulse', { height: 23 })}
            <div className='iconUnderline' />
          </div>
        </div>
        <div className='signerMenuItem signerMenuItemRight' onMouseDown={() => this.store.setSignerView('settings')}>
          <div className='signerMenuItemIcon'>
            {svg.octicon('settings', { height: 23 })}
            <div className='iconUnderline' />
          </div>
        </div>
      </div>
    )
  }

  setHighlight (mode, index) {
    if (!this.locked) this.setState({ accountHighlight: mode, highlightIndex: index || 0 })
  }

  closeAccounts () {
    if (this.store('selected.showAccounts')) this.store.toggleShowAccounts(false)
  }

  setSignerIndex (index) {
    this.locked = true
    link.rpc('setSignerIndex', index, (err, summary) => {
      this.setState({ accountHighlight: 'inactive', highlightIndex: 0 })
      this.store.toggleShowAccounts(false)
      setTimeout(() => { this.locked = false }, 1000)
      if (err) return console.log(err)
    })
  }

  renderSettingsMenu () {
    let viewIndex = this.store('selected.settings.viewIndex')

    // FIXME: Ugly hack to allow 'Rename Account' view to slide in from right
    if (viewIndex === 3) viewIndex = 2

    const views = this.store('selected.settings.views')
    const itemWidth = 35
    const markLeft = (itemWidth * viewIndex) + 'px'
    const markRight = (((views.length - viewIndex) - 1) * itemWidth) + 'px'
    return (
      <div className='settingsMenu'>
        <div className='settingsMenuItems'>
          <div className={viewIndex === 0 ? 'settingsMenuItem settingsMenuItemSelected' : 'settingsMenuItem'} onMouseDown={() => this.store.setSettingsView(0)}>
            <div className='settingsMenuItemIcon' style={{ left: '2px', top: '2px' }}>{svg.octicon('key', { height: 18 })}</div>
          </div>
          <div className={viewIndex === 1 ? 'settingsMenuItem settingsMenuItemSelected' : 'settingsMenuItem'} onMouseDown={() => this.store.setSettingsView(1)}>
            <div className='settingsMenuItemIcon'>{svg.octicon('checklist', { height: 22 })}</div>
          </div>
          <div className={viewIndex === 2 ? 'settingsMenuItem settingsMenuItemSelected' : 'settingsMenuItem'} onMouseDown={() => this.store.setSettingsView(2)}>
            <div className='settingsMenuItemIcon' style={{ left: '-1px', top: '0px' }}>{svg.octicon('gear', { height: 20 })}</div>
          </div>
        </div>
        <div className='settingsMenuSelect'>
          <div className='settingsMenuMark' style={{ left: markLeft, right: markRight }}>
            <div className='settingsMenuMarkLine' />
          </div>
        </div>
      </div>
    )
  }

  // renderAccountList () {
  //   const index = this.store('main.accounts', this.props.id, 'index')
  //   const startIndex = this.store('selected.accountPage') * 5
  //   const highlight = (this.state.accountHighlight === 'inactive') ? index : this.state.highlightIndex
  //   const currentSymbol = this.store('main.networks', type, id, 'symbol') || 'ETH'
  //   return (
  //     <div className='accountListWrap'>
  //       <div className='accountList' onMouseDown={e => e.stopPropagation()}>
  //         <div className='accountListItems'>
  //           {this.store('main.accounts', this.props.id, 'addresses').slice(startIndex, startIndex + 5).map((a, i) => {
  //             i = startIndex + i
  //             const balance = this.store('balances', a)
  //             return (
  //               <div
  //                 key={i}
  //                 className={i === highlight ? 'accountListItem accountListItemSelected' : 'accountListItem'}
  //                 onMouseDown={() => this.setSignerIndex(i)}
  //                 onMouseEnter={() => this.setHighlight('active', i)}
  //                 onMouseLeave={() => this.setHighlight('inactive', i)}
  //               >
  //                 <div className='accountListItemCheck'>{svg.octicon('check', { height: 27 })}</div>
  //                 <div className='accountListItemAddress'>{a ? a.substring(0, 6) : ''}{svg.octicon('kebab-horizontal', { height: 16 })}{a ? a.substr(a.length - 4) : ''}</div>
  //                 <div className='accountListItemBalance'>{currentSymbol + ' ' + (balance === undefined ? '-.------' : parseFloat(balance).toFixed(6))}</div>
  //               </div>
  //             )
  //           })}
  //         </div>
  //         <div className='accountPageToggle'>
  //           <div className='accountPageButton accountPageButtonLeft' onMouseDown={() => this.updateAccountPage('<')}>{svg.octicon('chevron-left', { height: 18 })}</div>
  //           <div className='accountPageCurrent'>{this.store('selected.accountPage') + 1}</div>
  //           <div className='accountPageButton accountPageButtonRight' onMouseDown={() => this.updateAccountPage('>')}>{svg.octicon('chevron-right', { height: 18 })}</div>
  //         </div>
  //         {this.renderSettingsMenu()}
  //       </div>
  //     </div>
  //   )
  // }

  // updateAccountPage (d) {
  //   let accountPage = this.store('selected.accountPage')
  //   accountPage = d === '<' ? accountPage - 1 : accountPage + 1
  //   const max = Math.ceil((this.store('main.accounts', this.props.id, 'addresses').length / 5) - 1)
  //   if (accountPage < 0) accountPage = 0
  //   if (accountPage > max) accountPage = max
  //   this.store.accountPage(accountPage)
  // }

  getAddressSize () {
    const ensName = this.store('main.accounts', this.props.id, 'ensName')
    if (ensName) {
      if (ensName.length <= 13) {
        return 18
      } else {
        let size = 18 - (ensName.length - 13)
        if (size < 8) size = 8
        return size
      }
    } else {
      return 20
    }
  }

  renderStatus () {
    // let open = current && this.store('selected.open')
    // TODO: Set Signer Name
    // let currentIndex = this.store('main.accounts', this.props.id, 'index')
    // const status = this.props.status.charAt(0).toUpperCase() + this.props.status.substr(1)
    // if (this.state.accountHighlight === 'active') currentIndex = this.state.highlightIndex

    const { address, ensName, active } = this.store('main.accounts', this.props.id)
    const formattedAddress = address || '0x'

    let requests = this.store('main.accounts', this.props.id, 'requests') || {}
    requests = Object.keys(requests).filter(r => requests[r].mode === 'normal')

    return this.props.status !== 'ok' ? (
      <div className='signerStatusNotOk'>{status}</div>
    ) : (
      <>
        {!this.state.addressHover ? (
          <div className='signerName'>
            <div className={(!ensName || !this.props.name) ? 'signerNameText' : 'signerNameText signerNameTextENS'}>
              {this.props.name}
            </div>
          </div>
        ) : null}
        <div className={'signerAddress'}>
          <div className='transactionToAddress'
            onMouseEnter={() => {
              this.setState({ addressHover: true })
            }}
            onMouseLeave={() => {
              this.setState({ addressHover: false })
            }}
            onMouseDown={this.copyAddress.bind(this)}
          >
            <div className='transactionToAddressLargeWrap'>
              {this.state.addressHover ? (
                <div className='transactionToAddressLarge transactionToAddressCopy'>copy address</div>
              ) : ensName ? (
                <div className='transactionToAddressLarge transactionToAddressENS' style={{ fontSize: this.getAddressSize() + 'px' }}>{ensName}</div>
              ) : (
                <div className={this.props.name ? 'transactionToAddressLarge' : 'transactionToAddressLarge transactionToAddressENS'}>{formattedAddress.substring(0, 6)} {svg.octicon('kebab-horizontal', { height: 16 })} {formattedAddress.substr(formattedAddress.length - 5)}</div>
              )
              }
            </div>
            <div className={this.state.addressHover ? 'transactionToAddressFull' : 'transactionToAddressFull transactionToAddressFullHidden'}>
              {this.state.copied ? <span className='transactionToAddressFullCopied'>{'Address Copied'}{svg.octicon('clippy', { height: 14 })}</span> : formattedAddress}
            </div>
          </div>
        </div>
        {(() => {
          if (this.state.addressHover) return null
          let requestBadgeClass = 'accountNotificationBadge'
          if (active) requestBadgeClass += ' accountNotificationBadgeReady'
          if (requests.length > 0) requestBadgeClass += ' accountNotificationBadgeActive'
          return (
            <div className={requestBadgeClass}>
              {requests.length}
            </div>
          )
        })()}
        {/* <div
          className='addressSelect' onMouseDown={e => {
            e.stopPropagation()
            this.store.toggleShowAccounts()
          }}
        >
          <div className='addressSelectButton'>
            <div className='addressSelectArrow'>{svg.octicon('chevron-down', { height: 16 })}</div>
            <div className='addressSelectText'>Addresses</div>
            <div className='addressSelectArrow'>{svg.octicon('chevron-down', { height: 16 })}</div>
          </div>
        </div> */}
        {/* <div className='signerInfo'>
          <Balances {...this.props} highlightIndex={this.state.highlightIndex} accountHighlight={this.state.accountHighlight} />
        </div> */}
      </>
    )
  }

  hideSignerStatus (value) {
    this.setState({ hideSignerStatus: value })
  }

  render () {
    const current = (this.store('selected.current') === this.props.id) && this.props.status === 'ok'
    const open = current && this.store('selected.open')
    const minimized = this.store('selected.minimized')
    this.selected = current && !minimized
    let signerClass = 'signer'
    if (this.props.status === 'ok') signerClass += ' okSigner'
    if (open) signerClass += ' openSigner'
    if (this.store('selected.view') === 'settings') signerClass += ' signerInSettings'
    if (this.store('selected.showAccounts')) signerClass += ' signerAccountExpand'

    const style = {}
    const initial = this.store('selected.position.initial')

    if (current) {
      // Currently selected
      style.position = 'absolute'
      style.top = initial.top // open ? 40 : initial.top
      style.bottom = initial.bottom // open ? 3 : initial.bottom
      style.left = '4px'
      style.right = '4px'
      style.zIndex = '100000000'
      const panelHeight = document.body.offsetHeight
      style.height = open ? panelHeight - 62 - 3 : initial.height - 3
      let top = (initial.top - 6) * -1
      style.transform = open ? `translateY(${top}px)` : 'translateY(0px)'
    } else if (this.store('selected.current') !== '') {
      // Not currently selected, but another signer is
      style.opacity = 0
      style.pointerEvents = 'none'
      style.transition = '300ms cubic-bezier(.82,0,.12,1) all'
      if (this.store('selected.open')) {
        // Not open, but another signer is
        style.transform = this.props.index > this.store('selected.position.initial.index') ? 'translate(0px, 100px)' : 'translate(0px, -20px)'
        style.opacity = 0
        style.pointerEvents = 'none'
      } else {
        // style.transition = '400ms linear all'
        style.transform = 'translate(0px, 0px)'
        // style.transitionDelay = '400ms'
        style.opacity = 1
      }
    } else {
      if (this.store('view.addAccount')) {
        style.opacity = 0
        style.pointerEvents = 'none'
      } else {
        style.transition = '1.48s cubic-bezier(.82,0,.12,1) all'
        style.transitionDelay = '0s'
      }
    }

    const account = this.store('main.accounts', this.props.id)
    let signer

    if (account.signer) {
      signer = this.store('main.signers', account.signer)
    } else if (account.smart)  {
      const actingSigner = this.store('main.accounts', account.smart.actor, 'signer')
      if (actingSigner) signer = this.store('main.signers', actingSigner)
    }

    const { data } = this.store('panel.nav')[0] || {}
    if (data && data.aux && data.aux.height) {
      style.height = style.height - data.aux.height
    }

    return (
      <div className='signerWrap' style={current ? { height: initial.height + 'px' } : {}} onMouseDown={() => this.closeAccounts()}>
        <div className={signerClass} style={style} ref={ref => { if (ref) this.signer = ref }}>
          <div className='signerContainer' style={current ? { height: '100%' } : {}}>
            {this.store('view.clickGuard') ? <div className='clickGuard' /> : null}
            {!this.state.hideSignerStatus && open ? (
              <SignerStatus open={open} signer={signer} hideSignerStatus={this.hideSignerStatus.bind(this)} />
            ) : null}
            <div 
              className={this.props.active ? 'signerTop signerTopActive' : 'signerTop'} 
              onMouseEnter={() => this.setState({ openHover: true })} 
              onMouseLeave={() => this.setState({ openHover: false })}
            >
              {!this.state.addressHover ? this.renderType() : null} 
              {!this.state.addressHover ? this.renderSignerIndicator() : null} 
              {!this.state.addressHover ? (
                <>
                  <div className='accountGrabber' style={open || true ? { opacity: 0, pointerEvents: 'none' } : {}}>
                    {svg.grab(35)}
                  </div>
                  <div className='signerSelect' onMouseDown={this.typeClick.bind(this)}>
                    <div className='signerSelectIconWrap'>
                      <div className='signerSelectIcon' style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        {svg.chevron(26)}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
              {/* {this.renderMenu()} */}
              {this.renderStatus()}
            </div>
            {current ? (
              <AccountBody
                id={this.props.id} 
                addresses={this.props.addresses} 
                minimized={minimized} 
                status={this.props.status} 
                signer={this.props.signer} 
              /> 
            ) : null}
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Account)
