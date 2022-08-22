import React from 'react'
import Restore from 'react-restore'

import svg from '../../../../resources/svg'
import link from '../../../../resources/link'

import Default from './Default'

import Activity from './Activity'
import Balances from './Balances'
import Gas from '../../../../resources/Components/Gas'
import Inventory from './Inventory'
import Launcher from './Launcher'
import Permissions from './Permissions'
import Requests from './Requests'
import Settings from './Settings'
import SignerStatus from './SignerStatus'
import { getAddress } from '../../../../resources/domain/transaction'

// move 
import ProviderRequest from './Requests/ProviderRequest'
import TransactionRequest from './Requests/TransactionRequest'
import SignatureRequest from './Requests/SignatureRequest'
import ChainRequest from './Requests/ChainRequest'
import AddTokenRequest from './Requests/AddTokenRequest'
import SignTypedDataRequest from './Requests/SignTypedDataRequest'

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



class _AccountModule extends React.Component {
  render () {
    const { 
      id, 
      module, 
      top, 
      index, 
      expandModule, 
      expanded, 
      expandedData,
      account
    } = this.props
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
    // if (id === 'requests') moduleClass = ' transparentModule'

    return (
      <div className={'accountModule ' + moduleClass} style={style}>
        <div className='accountModuleInner cardShow' style={{ animationDelay: (index * 0.1) + 's'}}>
          {
            id === 'gas' ? <Gas 
              moduleId={id} 
              id={account}
              expandModule={expandModule}
              expanded={expanded}
            /> :
            id === 'requests' ? <Requests 
              _id={id}
              id={account}
              addresses={this.props.addresses} 
              minimized={this.props.minimized} 
              status={this.props.status} 
              signer={this.props.signer} 
              expandModule={expandModule}
              expanded={expanded}
            /> :
            id === 'activity' ? <Activity 
              moduleId={id} 
              id={account}
              expandModule={expandModule}
              expanded={expanded}
            /> :
            id === 'launcher' ? <Launcher 
              moduleId={id}
              id={account} 
              expandModule={expandModule}
              expanded={expanded}
            /> :
            id === 'inventory' ? <Inventory 
              moduleId={id} 
              account={account}
              expandModule={expandModule}
              expanded={expanded}
              expandedData={expandedData}
            /> :
            id === 'permissions' ? <Permissions
              moduleId={id}
              account={account}
              expandModule={expandModule}
              expanded={expanded}
            /> :
            id === 'balances' ? <Balances
              moduleId={id}
              account={account}
              expandModule={expandModule}
              expanded={expanded}
            /> :
            id === 'settings' ? <Settings
              moduleId={id}
              account={account}
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
}

const AccountModule = Restore.connect(_AccountModule)

// account module is position absolute and with a translateX 
class _AccountMain extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      expandedModule: '',
      hideSignerStatus: false
    }
  }
  hideSignerStatus (value) {
    this.setState({ hideSignerStatus: value })
  }
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
  
  expandModule (data) {
    link.send('nav:forward', 'panel', { view: 'expandedModule', ...data })
  }
  renderSignerStatus () {
    const current = (this.store('selected.current') === this.props.id) && this.props.status === 'ok'
    const open = current && this.store('selected.open')

    const account = this.store('main.accounts', this.props.id)
    let signer

    if (account.signer) {
      signer = this.store('main.signers', account.signer)
    } else if (account.smart)  {
      const actingSigner = this.store('main.accounts', account.smart.actor, 'signer')
      if (actingSigner) signer = this.store('main.signers', actingSigner)
    }
    return !this.state.hideSignerStatus && open ? (
      <SignerStatus open={open} signer={signer} hideSignerStatus={this.hideSignerStatus.bind(this)} />
    ) : null
  }
  render () {
    const accountModules = this.store('panel.account.modules')
    const accountModuleOrder = this.store('panel.account.moduleOrder')
    let slideHeight = 0
    const modules = accountModuleOrder.map((id, i) => {
      const module = accountModules[id] || { height: 0 }
      slideHeight += module.height + 7
      return <AccountModule
        key={id}
        id={id} 
        account={this.props.id}
        module={module} 
        top={slideHeight - module.height + 40}
        index={i} 
        expandModule={this.expandModule.bind(this)}
      />
    })
    return (
      <div className='accountMain'>
        {this.renderSignerStatus()}
        <div className='accountMainScroll' style={{ pointerEvents: this.state.expandedModule ? 'none' : 'auto' }}>
          <div className='accountMainSlide' style={{ height: slideHeight + 'px' }}>
            {modules}
          </div>
        </div>
        {/* {this.state.expandedModule ? (
          <AccountView 
            back={() => {
              link.send('tray:action', 'backPanel', { view, data })
            }}
            {...this.props}
            accountViewTitle={'accountViewTitle'}
          >
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
        ) : (
         
        )} */}
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
  renderRequest (req, data) {
    const activeAccount =  this.store('main.accounts', this.props.id)
    const signingDelay = isHardwareSigner(activeAccount) ? 200 : 1500

    if (req.type === 'transaction') {
      return (
        <TransactionRequest 
          key={req.handlerId}
          req={req}
          step={data.step}
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
    const crumb = this.store('windows.panel.nav')[0] || {}
    if (crumb.view === 'requestView') {
      const { req, i } = crumb
      let accountViewTitle, accountViewIcon
      if (req.type === 'access') {
        accountViewTitle = 'Account Access'
        // accountViewIcon = svg.accounts(17)
      } else if (req.type === 'sign') {
        accountViewTitle = 'Sign Message'
        // accountViewIcon = svg.sign(17)
      } else if (req.type === 'signTypedData') {
        accountViewTitle = 'Sign Data'
        // accountViewIcon = svg.sign(17)
      } else if (req.type === 'addChain') { 
        accountViewTitle = 'Add Chain'
        // accountViewIcon = svg.chain(17)
      } else if (req.type === 'switchChain') {
        accountViewTitle = 'Switch Chain'
        // accountViewIcon = svg.chain(17)
      } else if (req.type === 'addToken')  {
        accountViewTitle = 'Add Token'
        // accountViewIcon = svg.tokens(17)
      } else if (req.type === 'transaction')  {
        accountViewTitle = 'Sign Transaction'
        // accountViewIcon = svg.broadcast(17)
      }
      return (
        <AccountView 
          back={() => {
            link.send('nav:back', 'panel')
          }}
          {...this.props}
          accountViewTitle={accountViewTitle}
          accountViewIcon={accountViewIcon}
        >
          {this.renderRequest(req, crumb)}
        </AccountView>
      )
    } else if (crumb.view === 'expandedModule') {
      return (
        <AccountView 
          back={() => {
            link.send('nav:back', 'panel')
          }}
          {...this.props}
          accountViewTitle={crumb.id}
        >
          <div 
            className='accountsModuleExpand cardShow' 
            onMouseDown={() => this.setState({ expandedModule: false })}
          >
            <div className='moduleExpanded' onMouseDown={(e) => {
              e.stopPropagation()
            }}>
              <AccountModule 
                id={crumb.id}
                account={crumb.account}
                module={{ height: 'auto' }}
                top={0}
                index={0}
                expandModule={(view, data) => {
                  link.send('tray:action', 'navPanel', { view: 'expandedModule', data }) 
                }} 
                expanded={true} 
                expandedData={crumb}
              />
            </div>
          </div>
        </AccountView>
      )
    } else {
      return (
        <AccountMain {...this.props} />
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
    this.setState({ addressHover: false }) 
  }

  copyAddress () {
    link.send('tray:clipboardData', getAddress(this.props.id))
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
    const formattedAddress = getAddress(address)

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

  render () {
    //const current = (this.store('selected.current') === this.props.id) && this.props.status === 'ok'
   // const open = current && this.store('selected.open')
    const minimized = this.store('selected.minimized')

    const account = this.store('main.accounts', this.props.id)
    let signer

    if (account.signer) {
      signer = this.store('main.signers', account.signer)
    } else if (account.smart)  {
      const actingSigner = this.store('main.accounts', account.smart.actor, 'signer')
      if (actingSigner) signer = this.store('main.signers', actingSigner)
    }

    return (
      <AccountBody
        id={this.props.id} 
        addresses={this.props.addresses} 
        minimized={minimized} 
        status={this.props.status} 
        signer={this.props.signer} 
      />   
    )
  }
}

export default Restore.connect(Account)
