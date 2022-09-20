import React from 'react'
import ReactDOM from 'react-dom'
import Restore from 'react-restore'
import utils from 'web3-utils'
import BigNumber from 'bignumber.js'

import Account from './Account'
// import TxBar from './RequestCommand/TxBar'
// import TxConfirmations from './TxConfirmations'
import Time from './Time'
import RequestCommand from './RequestCommand'

import svg from '../../../resources/svg'
import link from '../../../resources/link'

// import { usesBaseFee } from '../../../resources/domain/transaction'

const FEE_WARNING_THRESHOLD_USD = 50


// import Filter from '../../Components/Filter'

let firstScroll = true

class _Footer extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      allowInput: true
    }
  }
  approve (reqId, req) {
    link.rpc('approveRequest', req, () => {}) // Move to link.send
  }
  decline (reqId, req) {
    link.rpc('declineRequest', req, () => {}) // Move to link.send
  }
  render () {
    const crumb = this.store('windows.panel.nav')[0] || {}
    if (crumb.view === 'requestView') {
      const { accountId, requestId } = crumb.data
      const req = this.store('main.accounts', accountId, 'requests', requestId)
      if (req) {
        if (req.type === 'transaction' && crumb.data.step === 'confirm') {
          return (
            <div className='footerModule'>
              <RequestCommand req={req} />
            </div>
          )
        } else if (req.type === 'access') {
          return (
            <div className='footerModule'>
              <div className='requestApprove'>
                <div 
                  className='requestDecline' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => { if (this.state.allowInput) link.send('tray:giveAccess', req, false) 
                }}>
                  <div className='requestDeclineButton _txButton _txButtonBad'>
                    <span>Decline</span>
                  </div>
                </div>
                <div 
                  className='requestSign' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => { if (this.state.allowInput) link.send('tray:giveAccess', req, true) 
                }}>
                  <div className='requestSignButton _txButton'>
                    <span>Approve</span>
                  </div>
                </div>
              </div>
            </div>
          )
        } else if (req.type === 'sign') {
          return (
            <div className='footerModule'>
              <div className='requestApprove'>
                <div 
                  className='requestDecline' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => { if (this.state.allowInput) this.decline(req.handlerId, req) 
                }}>
                  <div className='requestDeclineButton _txButton _txButtonBad'>
                    <span>Decline</span>
                  </div>
                </div>
                <div 
                  className='requestSign' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => {
                    if (this.state.allowInput) this.approve(req.handlerId, req) 
                  }}
                >
                  <div className='requestSignButton _txButton'>
                    <span>Sign</span>
                  </div>
                </div>
              </div>
            </div>
          )
        } else if (req.type === 'signTypedData') {
          return (
            <div className='footerModule'>
              <div className='requestApprove'>
                <div 
                  className='requestDecline' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}} 
                  onClick={() => { if (this.state.allowInput) this.decline(req.handlerId, req) 
                }}>
                  <div className='requestDeclineButton _txButton _txButtonBad'>
                    <span>Decline</span>
                  </div>
                </div>
                <div 
                  className='requestSign' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => { if (this.state.allowInput) this.approve(req.handlerId, req) 
                }}>
                  <div className='requestSignButton _txButton'>
                    <span>Sign</span>
                  </div>
                </div>
              </div>
            </div>
          )
        } else if (req.type === 'addChain' || req.type === 'switchChain') {
          return (
            req.type === 'switchChain' ? (
              <div className='requestApprove'>
                <div 
                  className='requestDecline' 
                  style={{ pointerEvents: this.state.allowInput? 'auto' : 'none'}}
                  onClick={() => { if (this.state.allowInput) link.send('tray:switchChain', false, false, req) 
                }}>
                  <div className='requestDeclineButton _txButton _txButtonBad'>
                    <span>Decline</span>
                  </div>
                </div>
                <div 
                  className='requestSign' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => { if (this.state.allowInput) link.send('tray:switchChain', chain.type, parseInt(chain.id), req)
                }}>
                  <div className='requestSignButton _txButton'>
                    <span>Switch</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className='requestApprove'>
                <div 
                  className='requestDecline' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => { 
                    if (this.state.allowInput) {
                      link.send('tray:rejectRequest', req)
                    }
                  }
                }>
                  <div className='requestDeclineButton _txButton _txButtonBad'>
                    <span>Decline</span>
                  </div>
                </div>
                <div 
                  className='requestSign' 
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => {
                    if (this.state.allowInput) {
                      link.send('tray:resolveRequest', req, null)
                      link.send('tray:action', 'navDash', { view: 'notify', data: { notify: 'addChain', notifyData: { chain } } })
                    }
                  }
                }>
                  <div className='requestSignButton _txButton'>
                    <span>Review</span>
                  </div>
                </div>
              </div>
            )
          )
        } else if (req.type === 'addToken') {
          return (
            <div className='footerModule'>
              <div className='requestApprove'>
                <div
                  className='requestDecline'
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => { if (this.state.allowInput) link.send('tray:addToken', false, this.props.req)
                }}>
                  <div className='requestDeclineButton _txButton _txButtonBad'>
                    <span>Decline</span>
                  </div>
                </div>
                <div
                  className='requestSign'
                  style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none'}}
                  onClick={() => {
                    if (this.state.allowInput) {
                      link.send('tray:resolveRequest', req, null)
                      link.send('tray:action', 'navDash', { view: 'notify', data: { notify: 'addToken', notifyData: { token: req.token } } })
                    }
                  }
                }>
                  <div className='requestSignButton _txButton'>
                    <span>Review</span>
                  </div>
                </div>
              </div>
            </div>
          )
        } else {
          return null
        }
      }
    }
  }
}

const Footer = Restore.connect(_Footer)

class Main extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      accountFilter: ''
    }
  }

  reportScroll () {
    this.store.initialScrollPos(ReactDOM.findDOMNode(this.scroll).scrollTop)
  }

  resetScroll () {
    setTimeout(() => {
      if (firstScroll) {
        firstScroll = false
      } else {
        this.scroll.scrollTo({ top: -999999999999, left: 0, behavior: 'smooth' })
      }
    }, 3000)
  }

  accountSort (accounts, a, b) {
    try {
      let [aBlock, aLocal] = accounts[a].created.split(':')
      let [bBlock, bLocal] = accounts[b].created.split(':')
  
      aLocal = parseInt(aLocal)
      bLocal = parseInt(bLocal)
  
      if (aBlock === 'new' && bBlock !== 'new') return -1
      if (bBlock !== 'new' && aBlock === 'new') return 1
      if (aBlock === 'new' && bBlock === 'new') return aLocal >= bLocal ? 1 : 0
  
      aBlock = parseInt(aBlock)
      bBlock = parseInt(bBlock)
  
      if (aBlock > bBlock) return -1
      if (aBlock < bBlock) return -1
      if (aBlock === bBlock) return aLocal >= bLocal ? 1 : 0

      return 0
    } catch (e) {
      console.error(e)
      return 0
    }
  }

  render () {
    const accounts = this.store('main.accounts')
    const current = this.store('selected.current')
    const open = this.store('selected.open')
    if (!open) return

    const currentAccount = accounts[current]
    if (!currentAccount) return null

    return (
      <>
        <Account 
          key={current.id} 
          {...currentAccount} 
          index={1} 
          reportScroll={() => this.reportScroll()} 
          resetScroll={() => this.resetScroll()} 
        />
        <Footer />
      </>
    )
  }
}

export default Restore.connect(Main)
