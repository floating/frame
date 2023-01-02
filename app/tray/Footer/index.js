import React from 'react'
import Restore from 'react-restore'

import link from '../../../resources/link'
import { isHardwareSigner } from '../../../resources/domain/signer'
import { isSignatureRequest } from '../../../resources/domain/request'

import RequestCommand from './RequestCommand'

const measure = (ref) => {
  if (!ref || !ref.current) return { height: 0, width: 0 }
  const { clientHeight, clientWidth } = ref.current
  return { height: clientHeight, width: clientWidth }
}

let lastHeight

class Footer extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      allowInput: true
    }
    this.footerRef = React.createRef()
  }
  componentDidMount() {
    this.observer = new ResizeObserver(() => {
      const size = measure(this.footerRef)
      if (size.height !== lastHeight) {
        link.send('tray:action', 'setFooterHeight', 'panel', size.height)
      }
    })
    if (this.observer) this.observer.observe(this.footerRef.current)
  }
  componentWillUnmount() {
    if (this.footerRef && this.footerRef.current && this.observer)
      this.observer.unobserve(this.footerRef.current)
  }
  approve(reqId, req) {
    link.rpc('approveRequest', req, () => {}) // Move to link.send
  }
  decline(reqId, req) {
    link.rpc('declineRequest', req, () => {}) // Move to link.send
  }

  rejectRequest() {
    if (this.state.allowInput) {
      link.send('tray:rejectRequest', this.props.req)
    }
  }
  renderFooter() {
    const crumb = this.store('windows.panel.nav')[0] || {}

    if (crumb.view === 'requestView') {
      const { accountId, requestId } = crumb.data
      const account = this.store('main.accounts', accountId)
      const req = this.store('main.accounts', accountId, 'requests', requestId)
      if (req) {
        if (req.type === 'transaction' && crumb.data.step === 'confirm') {
          return (
            <RequestCommand req={req} signingDelay={isHardwareSigner(account.lastSignerType) ? 0 : 1500} />
          )
        } else if (req.type === 'access') {
          return (
            <div className='requestApprove'>
              <div
                className='requestDecline'
                style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none' }}
                onClick={() => {
                  if (this.state.allowInput) link.send('tray:giveAccess', req, false)
                }}
              >
                <div className='requestDeclineButton _txButton _txButtonBad'>
                  <span>Decline</span>
                </div>
              </div>
              <div
                className='requestSign'
                style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none' }}
                onClick={() => {
                  if (this.state.allowInput) link.send('tray:giveAccess', req, true)
                }}
              >
                <div className='requestSignButton _txButton'>
                  <span>Approve</span>
                </div>
              </div>
            </div>
          )
        } else if (isSignatureRequest(req.type) && crumb.data.step === 'confirm') {
          return (
            <RequestCommand req={req} signingDelay={isHardwareSigner(account.lastSignerType) ? 0 : 1500} />
          )
        } else if (req.type === 'addChain' || req.type === 'switchChain') {
          return req.type === 'switchChain' ? (
            <div className='requestApprove'>
              <div
                className='requestDecline'
                style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none' }}
                onClick={() => {
                  if (this.state.allowInput) link.send('tray:switchChain', false, false, req)
                }}
              >
                <div className='requestDeclineButton _txButton _txButtonBad'>
                  <span>Decline</span>
                </div>
              </div>
              <div
                className='requestSign'
                style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none' }}
                onClick={() => {
                  if (this.state.allowInput)
                    link.send('tray:switchChain', chain.type, parseInt(chain.id), req)
                }}
              >
                <div className='requestSignButton _txButton'>
                  <span>Switch</span>
                </div>
              </div>
            </div>
          ) : (
            <div className='requestApprove'>
              <div
                className='requestDecline'
                style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none' }}
                onClick={() => {
                  this.rejectRequest()
                }}
              >
                <div className='requestDeclineButton _txButton _txButtonBad'>
                  <span>Decline</span>
                </div>
              </div>
              <div
                className='requestSign'
                style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none' }}
                onClick={() => {
                  if (this.state.allowInput) {
                    link.send('tray:resolveRequest', req, null)
                    link.send('tray:action', 'navDash', { view: 'chains', data: { newChain: req.chain } })
                  }
                }}
              >
                <div className='requestSignButton _txButton'>
                  <span>Review</span>
                </div>
              </div>
            </div>
          )
        } else if (req.type === 'addToken') {
          return (
            <div className='requestApprove'>
              <div
                className='requestDecline'
                style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none' }}
                onClick={() => {
                  if (this.state.allowInput) link.send('tray:addToken', false, this.props.req)
                }}
              >
                <div
                  className='requestDeclineButton _txButton _txButtonBad'
                  onClick={() => {
                    this.rejectRequest()
                  }}
                >
                  <span>Decline</span>
                </div>
              </div>
              <div
                className='requestSign'
                style={{ pointerEvents: this.state.allowInput ? 'auto' : 'none' }}
                onClick={() => {
                  if (this.state.allowInput) {
                    const { address, symbol, decimals, logoURI, name, chainId } = req.token
                    link.send('tray:resolveRequest', req, null)
                    link.send('tray:action', 'navDash', {
                      view: 'tokens',
                      data: {
                        notify: 'addToken',
                        notifyData: {
                          tokenData: { symbol, decimals, logoURI, name },
                          chainId,
                          address
                        }
                      }
                    })
                  }
                }}
              >
                <div className='requestSignButton _txButton'>
                  <span>Review</span>
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
  render() {
    const footerHeight = this.store('windows.panel.footer.height')
    return (
      <div className='footerModule' style={{ height: footerHeight + 'px' }}>
        <div ref={this.footerRef} className='footerWrap'>
          {this.renderFooter()}
        </div>
      </div>
    )
  }
}

export default Restore.connect(Footer)
