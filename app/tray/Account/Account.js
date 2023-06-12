import React, { useState } from 'react'
import Restore from 'react-restore'

import svg from '../../../resources/svg'
import link from '../../../resources/link'

import { Fluid, Entity, useFluid } from '../../../resources/Components/Fluid'
import useStore from '../../../resources/Hooks/useStore'

import Default from './Default'

import Activity from './Activity'
import Chains from './Chains'
import Balances from './Balances'
import Gas from '../../../resources/Components/Monitor'
import Inventory from './Inventory'
import Permissions from './Permissions'
import Requests from './Requests'
import Settings from './Settings'
import Signer from './Signer'

// AccountManager
import { AccountManager } from '../AccountManager'

// move
import ProviderRequest from './Requests/ProviderRequest'
import TransactionRequest from './Requests/TransactionRequest'
import SignatureRequest from './Requests/SignatureRequest'
import ChainRequest from './Requests/ChainRequest'
import AddTokenRequest from './Requests/AddTokenRequest'
import SignTypedDataRequest from './Requests/SignTypedDataRequest'
import SignPermitRequest from './Requests/SignPermitRequest'
import { isHardwareSigner } from '../../../resources/domain/signer'
import { accountViewTitles } from '../../../resources/domain/request'

const requests = {
  sign: SignatureRequest,
  signTypedData: SignTypedDataRequest,
  signErc20Permit: SignPermitRequest,
  transaction: TransactionRequest,
  access: ProviderRequest,
  addChain: ChainRequest,
  addToken: AddTokenRequest
}

const modules = {
  gas: Gas,
  requests: Requests,
  chains: Chains,
  activity: Activity,
  inventory: Inventory,
  permissions: Permissions,
  balances: Balances,
  signer: Signer,
  settings: Settings
}

class _AccountModule extends React.Component {
  getModule(moduleId, account, expanded, expandedData, filter) {
    const Module = modules[moduleId] || Default

    return (
      <Module
        account={account}
        expanded={expanded}
        expandedData={expandedData}
        filter={filter}
        moduleId={moduleId}
      />
    )
  }

  render() {
    const { id, module, top, index, expanded, expandedData, account, filter } = this.props
    let hidden = false
    let style = {
      // transform: `translateY(${top}px)`,
      zIndex: 9999 - index,
      height: module.height,
      opacity: 1
    }

    if (hidden) {
      style = {
        // transform: `translateY(${top}px)`,
        zIndex: 9999 - index,
        height: 0,
        opacity: 0,
        overflow: 'hidden'
      }
    }

    if (expanded) {
      return this.getModule(id, account, expanded, expandedData, filter)
    } else {
      return (
        <div className={'accountModule'} ref={this.moduleRef} style={style}>
          <Entity
            key={id}
            item={{ id }}
            id={id} // This needs to be a completely uniquie id
            type={'group'}
            onOver={(dragItem, position) => {
              return this.props.updateModuleOrder(dragItem.id, id, position)
            }}
          >
            <div className='accountModuleInner'>
              <div className='accountModuleCard'>
                {this.getModule(id, account, expanded, expandedData, filter)}
              </div>
            </div>
          </Entity>
        </div>
      )
    }
  }
}

const AccountModule = Restore.connect(_AccountModule)

// account module is position absolute and with a translateX

// class _AccountMain extends React.Component {
//   constructor(props, context) {
//     super(props, context)
//     this.state = {
//       expandedModule: '',
//       moduleOrder: context.store('panel.account.moduleOrder')
//     }
//   }
//   renderAccountFilter() {
//     return (
//       <div className='panelFilterAccount'>
//         <div className='panelFilterIcon'>{svg.search(12)}</div>
//         <div className='panelFilterInput'>
//           <input
//             tabIndex='-1'
//             type='text'
//             spellCheck='false'
//             onChange={(e) => {
//               const value = e.target.value
//               this.setState({ accountModuleFilter: value })
//             }}
//             value={this.state.accountModuleFilter}
//           />
//         </div>
//         {this.state.accountModuleFilter ? (
//           <div
//             className='panelFilterClear'
//             onClick={() => {
//               this.setState({ accountModuleFilter: '' })
//             }}
//           >
//             {svg.close(12)}
//           </div>
//         ) : null}
//       </div>
//     )
//   }

//   render() {
//     const accountModules = this.store('panel.account.modules')
//     const accountModuleOrder = this.state.moduleOrder
//     let slideHeight = 0
//     const modules = accountModuleOrder.map((id, i) => {
//       const module = accountModules[id] || { height: 0 }
//       slideHeight += module.height + 12
//       return (
//         <AccountModule
//           key={'toplevelmodule:' + id}
//           id={id}
//           account={this.props.id}
//           module={module}
//           top={slideHeight - module.height - 12}
//           index={i}
//           filter={this.state.accountModuleFilter}
//           updateModuleOrder={(dragId, overId, position) => {
//             let hasOrderChanged = false

//             this.setState((prevState) => {
//               let originalArray = [...prevState.moduleOrder] // Create a copy of the original array
//               let array = [...prevState.moduleOrder] // Create a copy of the array to be modified
//               let dragIndex = array.indexOf(dragId)
//               if (dragIndex === -1) {
//                 console.error('dragId not found in the array')
//                 return originalArray
//               }
//               array.splice(dragIndex, 1)
//               let overIndex = array.indexOf(overId)
//               if (overIndex === -1) {
//                 console.error('overId not found in the array')
//                 return originalArray
//               }
//               if (position === 'top' || position === 'left') {
//                 array.splice(overIndex, 0, dragId)
//               } else if (position === 'bottom' || position === 'right') {
//                 array.splice(overIndex + 1, 0, dragId)
//               } else {
//                 throw new Error('Invalid position')
//               }
//               // Check if the modified array is different from the original array
//               for (let i = 0; i < originalArray.length; i++) {
//                 if (originalArray[i] !== array[i]) {
//                   hasOrderChanged = true
//                   break
//                 }
//               }
//               return { moduleOrder: array }
//             })
//             return hasOrderChanged
//           }}
//         />
//       )
//     })
//     const footerHeight = this.store('windows.panel.footer.height')
//     return (
//       <Fluid>
//         <div className='accountMain' style={{ bottom: footerHeight + 'px' }}>
//           <div
//             className='accountMainScroll'
//             onScroll={(e) => {
//               console.log(e)
//             }}
//           >
//             {this.renderAccountFilter()}
//             <div className='accountMainSlide' style={{ height: slideHeight + 'px' }}>
//               {modules}
//             </div>
//           </div>
//         </div>
//       </Fluid>
//     )
//   }
// }

// const AccountMain = Restore.connect(_AccountMain)

const AccountMain = (props) => {
  const { id } = props

  const moduleOrder = useStore('panel.account.moduleOrder')
  const footerHeight = useStore('windows.panel.footer.height')
  const accountModules = useStore('panel.account.modules')

  const { setScrollTrigger } = useFluid()

  const [state, setState] = useState({
    expandedModule: '',
    moduleOrder,
    accountModuleFilter: ''
  })

  const accountModuleOrder = state.moduleOrder

  const renderAccountFilter = () => (
    <div className='panelFilterAccount'>
      <div className='panelFilterIcon'>{svg.search(12)}</div>
      <div className='panelFilterInput'>
        <input
          tabIndex='-1'
          type='text'
          spellCheck='false'
          onChange={(e) => {
            const value = e.target.value
            setState((prevState) => ({ ...prevState, accountModuleFilter: value }))
          }}
          value={state.accountModuleFilter}
        />
      </div>
      {state.accountModuleFilter ? (
        <div
          className='panelFilterClear'
          onClick={() => {
            setState((prevState) => ({ ...prevState, accountModuleFilter: '' }))
          }}
        >
          {svg.close(12)}
        </div>
      ) : null}
    </div>
  )

  let slideHeight = 0
  const modules = accountModuleOrder.map((moduleId, i) => {
    const module = accountModules[moduleId] || { height: 0 }
    slideHeight += module.height + 12
    return (
      <AccountModule
        key={`toplevelmodule:${moduleId}`}
        id={moduleId}
        account={id}
        module={module}
        top={slideHeight - module.height - 12}
        index={i}
        filter={state.accountModuleFilter}
        updateModuleOrder={(dragId, overId, position) => {
          let hasOrderChanged = false
          setState((prevState) => {
            let originalArray = [...prevState.moduleOrder]
            let array = [...prevState.moduleOrder]
            let dragIndex = array.indexOf(dragId)
            if (dragIndex === -1) {
              console.error('dragId not found in the array')
              return originalArray
            }
            array.splice(dragIndex, 1)
            let overIndex = array.indexOf(overId)
            if (overIndex === -1) {
              console.error('overId not found in the array')
              return originalArray
            }
            if (position === 'top' || position === 'left') {
              array.splice(overIndex, 0, dragId)
            } else if (position === 'bottom' || position === 'right') {
              array.splice(overIndex + 1, 0, dragId)
            } else {
              throw new Error('Invalid position')
            }
            for (let i = 0; i < originalArray.length; i++) {
              if (originalArray[i] !== array[i]) {
                hasOrderChanged = true
                break
              }
            }
            return { moduleOrder: array }
          })
          return hasOrderChanged
        }}
      />
    )
  })

  return (
    <div className='accountMain' style={{ bottom: `${footerHeight}px` }}>
      <div
        className='accountMainScroll'
        onScroll={(e) => {
          setScrollTrigger(e)
        }}
      >
        {renderAccountFilter()}
        <div className='accountMainSlide' style={{ height: `${slideHeight}px` }}>
          {modules}
        </div>
      </div>
    </div>
  )
}

// AccountView is a reusable template that provides the option to nav back to main
class _AccountView extends React.Component {
  render() {
    const footerHeight = this.store('windows.panel.footer.height')
    return (
      <div className='accountView' style={{ top: '140px', bottom: footerHeight + 'px' }}>
        <div className='accountViewMenu cardShow'>
          <div className='accountViewBack' onClick={() => this.props.back()}>
            {svg.chevronLeft(16)}
          </div>
          <div className='accountViewTitle'>
            <div className='accountViewIcon'>{this.props.accountViewIcon}</div>
            <div className='accountViewText'>{this.props.accountViewTitle}</div>
          </div>
        </div>
        <div className='accountViewMain cardShow'>{this.props.children}</div>
      </div>
    )
  }
}

const AccountView = Restore.connect(_AccountView)

class _AccountBody extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      view: 'request'
    }
  }

  getRequestComponent({ type }) {
    return requests[type]
  }

  getChainData(req) {
    if (req.type !== 'signErc20Permit') return {}
    const chainId = req.typedMessage.data.domain.chainId
    const chainName = this.store('main.networks.ethereum', chainId, 'name')
    const { primaryColor: chainColor, icon } = this.store('main.networksMeta.ethereum', chainId)

    return { chainId, chainName, chainColor, icon }
  }

  renderRequest(req, data = {}) {
    const Request = this.getRequestComponent(req)
    if (!Request) return null

    const { handlerId } = req
    const { step } = data

    const activeAccount = this.store('main.accounts', this.props.id)
    const originName = this.store('main.origins', req.origin, 'name')
    const chainData = this.getChainData(req)

    const signingDelay = isHardwareSigner(activeAccount.lastSignerType) ? 200 : 1500

    return (
      <Request
        key={handlerId}
        req={req}
        step={step}
        signingDelay={signingDelay}
        chainId={chainData.chainId}
        originName={originName}
        chainData={chainData}
      />
    )
  }

  getAccountViewTitle({ type }) {
    return accountViewTitles[type]
  }

  render() {
    const crumb = this.store('windows.panel.nav')[0] || {}

    if (crumb.view === 'requestView') {
      const { accountId, requestId } = crumb.data
      const req = this.store('main.accounts', accountId, 'requests', requestId)
      const accountViewTitle = this.getAccountViewTitle(req)

      return (
        <AccountView
          back={() => {
            link.send('nav:back', 'panel')
          }}
          {...this.props}
          accountViewTitle={accountViewTitle}
        >
          {this.renderRequest(req, crumb.data)}
        </AccountView>
      )
    } else if (crumb.view === 'expandedModule') {
      return (
        <AccountView
          back={() => {
            link.send('nav:back', 'panel')
          }}
          {...this.props}
          accountViewTitle={crumb.data.title || crumb.data.id}
          key={crumb.data.title || crumb.data.id}
        >
          <div
            className='accountsModuleExpand cardShow'
            onMouseDown={() => this.setState({ expandedModule: false })}
          >
            <div
              className='moduleExpanded'
              onMouseDown={(e) => {
                e.stopPropagation()
              }}
            >
              <AccountModule
                id={crumb.data.id}
                account={crumb.data.account}
                module={{ height: 'auto' }}
                top={0}
                index={0}
                expanded={true}
                expandedData={crumb.data}
              />
            </div>
          </div>
        </AccountView>
      )
    } else if (crumb.view === 'accountManager') {
      return <AccountManager />
    } else {
      return (
        <Fluid>
          <AccountMain {...this.props} />
        </Fluid>
      )
    }
  }
}

const AccountBody = Restore.connect(_AccountBody)

class Account extends React.Component {
  render() {
    return (
      <AccountBody
        id={this.props.id}
        addresses={this.props.addresses}
        status={this.props.status}
        signer={this.props.signer}
      />
    )
  }
}

export default Restore.connect(Account)
