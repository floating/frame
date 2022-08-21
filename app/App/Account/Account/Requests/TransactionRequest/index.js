import React from 'react'
import Restore from 'react-restore'
import utils from 'web3-utils'
import BigNumber from 'bignumber.js'

import { usesBaseFee } from '../../../../../../resources/domain/transaction'
import svg from '../../../../../../resources/svg'
import link from '../../../../../../resources/link'

// New Tx
import TxMain from './TxMain'
import TxMainNew from './TxMainNew'
import TxFeeNew from './TxFeeNew'
import TxAction from './TxAction'
import TxData from './TxData'
import TxRecipient from './TxRecipient'
import AdjustFee from './AdjustFee'
import ViewData from './ViewData'
import TxApproval from './TxApproval'

const FEE_WARNING_THRESHOLD_USD = 50

class Time extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      time: Date.now()
    }
    setInterval(() => {
      this.setState({ time: Date.now() })
    }, 1000)
  }

  msToTime (duration) {
    const seconds = Math.floor((duration / 1000) % 60)
    const minutes = Math.floor((duration / (1000 * 60)) % 60)
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
    let label, time
    if (hours) {
      label = hours === 1 ? 'hour ago' : 'hours ago'
      time = hours
    } else if (minutes) {
      label = minutes === 1 ? 'minute ago' : 'minutes ago'
      time = minutes
    } else {
      label = 'seconds ago'
      time = seconds
    }
    return { time, label }
  }

  render () {
    const { time, label } = this.msToTime(this.state.time - this.props.time)
    return (
      <div className='txProgressSuccessItem txProgressSuccessItemRight'>
        <div className='txProgressSuccessItemValue'>
          {time}
        </div>
        <div className='txProgressSuccessItemLabel'>
          {label}
        </div>
      </div>
    )
  }
}

class TransactionRequest extends React.Component {
  constructor (props, context) {
    super(props, context)
    this.chain = { 
      type: 'ethereum', 
      id: parseInt(props.req.data.chainId, 'hex')
    }
    this.state = { allowInput: false, dataView: false }

    setTimeout(() => {
      this.setState({ allowInput: true })
    }, props.signingDelay || 1500)
  }

  copyAddress (data) {
    link.send('tray:clipboardData', data)
    this.setState({ copied: true })
    setTimeout(_ => this.setState({ copied: false }), 1000)
  }

  // approve (reqId, req) {
  //   link.rpc('approveRequest', req, () => {}) // Move to link.send
  // }

  // decline (req) {
  //   link.rpc('declineRequest', req, () => {}) // Move to link.send
  // }

  toggleDataView (id) {
    this.setState({ dataView: !this.state.dataView })
  }

  hexToDisplayValue (hex) {
    return (Math.round(parseFloat(utils.fromWei(hex, 'ether')) * 1000000) / 1000000).toFixed(6)
  }

  txSectionStyle (index, height) {
    if (this.state.selectedIndex === index) {
      return {
        transform: `translateY(${0}px)`,
        height: `calc(${height} + 10px)`,
        zIndex: 20,
        borderRadius: '9px',
        background: 'rgba(237, 242, 253, 1)',
        left: '10px',
        right: '10px',
        padding: '0px 30px'
      }
    } else {
      return {
        transform: `translateY(${(index * -40) - 60}px)`,
        zIndex: 1
      }
    }
  }

  copyData (data) {
    link.send('tray:clipboardData', data)
    this.setState({ copiedData: true })
    setTimeout(_ => this.setState({ copiedData: false }), 1000)
  }

  overlayMode (mode) {
    this.setState({ overlayMode: mode })
  }

  toDisplayUSD (bn) {
    return bn.toFixed(2, BigNumber.ROUND_UP).toString()
  }

  allowOtherChain () {
    this.setState({ allowOtherChain: true })
  }

  renderAdjustFee () {
    const { accountId, handlerId, step } = this.props
    const req = this.store('main.accounts', accountId, 'requests', handlerId)
    return (
      <AdjustFee {...this.props} req={req} />
    )
  }

  renderViewData () {
    return (
      <ViewData {...this.props} />
    )
  }
  // renderApprovalButtons (req) {
  //   if (req.notice) {
  //     return null
  //   } else {
  //     return (
  //       <div className='requestApprove' style={{
  //         transform: req.automaticFeeUpdateNotice ? 'translateY(92px)' : 'translateY(0px)'
  //       }}>
  //         <div 
  //           className={req.automaticFeeUpdateNotice ? 'requestApproveFeeBlock requestApproveFeeBlockActive' : 'requestApproveFeeBlock'}
  //         >
  //           <div className='requestApproveFeeButton requestApproveFeeReject' onClick={() => {
  //             const { previousFee } = req.automaticFeeUpdateNotice
  //             if (previousFee.type === '0x2') {
  //               link.rpc('setBaseFee', previousFee.baseFee, req.handlerId, e => { if (e) console.error(e) })
  //               link.rpc('setPriorityFee', previousFee.priorityFee, req.handlerId, e => { if (e) console.error(e) })
  //             } else if (previousFee.type === '0x0')  {
  //               link.rpc('setGasPrice', previousFee.gasPrice, req.handlerId, e => { if (e) console.error(e) })
  //             }
  //           }}>{'reject fee'}</div>
  //           <div className='requestApproveFeeText'>{'Fee Updated'}</div>
  //           <div className='requestApproveFeeButton requestApproveFeeAccept' onClick={() => {
  //             link.rpc('removeFeeUpdateNotice', req.handlerId, e => { if (e) console.error(e) })
  //           }}>{'accept fee'}</div>
  //         </div>
  //         <div
  //           className='requestDecline' 
  //           style={{ 
  //             pointerEvents: this.state.allowInput && !req.automaticFeeUpdateNotice ? 'auto' : 'none',
  //             opacity: req.automaticFeeUpdateNotice ? 0.2 : 1
  //           }}
  //           onClick={() => {
  //             if (this.state.allowInput && !req.automaticFeeUpdateNotice) this.decline(req)
  //           }}
  //         >
  //           <div className='requestDeclineButton _txButton _txButtonBad'>Decline</div>
  //         </div>
  //         <div
  //           className='requestSign' 
  //           style={{ 
  //             pointerEvents: this.state.allowInput && !req.automaticFeeUpdateNotice ? 'auto' : 'none',
  //             opacity: req.automaticFeeUpdateNotice ? 0.2 : 1
  //           }}
  //           onClick={() => {
  //             if (this.state.allowInput && !req.automaticFeeUpdateNotice) {
  //               link.rpc('signerCompatibility', req.handlerId, (e, compatibility) => {
  //                 if (e === 'No signer')  {
  //                   this.store.notify('noSignerWarning', { req })
  //                 } else if (e === 'Signer locked') {
  //                   this.store.notify('signerLockedWarning', { req })
  //                 } else if (!compatibility.compatible && !this.store('main.mute.signerCompatibilityWarning')) {
  //                   this.store.notify('signerCompatibilityWarning', { req, compatibility, chain: this.chain })
  //                 } else if ((maxFeeUSD.toNumber() > FEE_WARNING_THRESHOLD_USD || this.toDisplayUSD(maxFeeUSD) === '0.00') && !this.store('main.mute.gasFeeWarning')) {
  //                   this.store.notify('gasFeeWarning', { req, feeUSD: this.toDisplayUSD(maxFeeUSD), currentSymbol })
  //                 } else {
  //                   this.approve(req.handlerId, req)
  //                 }
  //               })
  //             }}
  //           }
  //         >
  //           <div className='requestSignButton _txButton'> Sign </div>
  //         </div>
  //       </div>
  //     )
  //   }
  // }

  renderTx () {
    const { accountId, handlerId } = this.props
    const req = this.store('main.accounts', accountId, 'requests', handlerId)
    console.log({ accountId, handlerId, req })
    if (!req) return null
    const originalNotice = (req.notice || '').toLowerCase()
    let notice = req.notice

    const status = req.status
    const mode = req.mode
    const toAddress = (req.data && req.data.to) || ''
    let requestClass = 'signerRequest'
    // if (mode === 'monitor') requestClass += ' signerRequestMonitor'
    const success = (req.status === 'confirming' || req.status === 'confirmed')
    const error = req.status === 'error' || req.status === 'declined'
    if (success) requestClass += ' signerRequestSuccess'
    if (req.status === 'confirmed') requestClass += ' signerRequestConfirmed'
    else if (error) requestClass += ' signerRequestError'
    const layer = this.store('main.networks', this.chain.type, this.chain.id, 'layer')
    const nativeCurrency = this.store('main.networksMeta', this.chain.type, this.chain.id, 'nativeCurrency')
    const nativeUSD = nativeCurrency && nativeCurrency.usd && layer !== 'testnet' ? nativeCurrency.usd.price : 0
    const value = this.hexToDisplayValue(req.data.value || '0x')
    const currentSymbol = this.store('main.networks', this.chain.type, this.chain.id, 'symbol') || '?'

    let maxFeePerGas, maxFee, maxFeeUSD

    if (usesBaseFee(req.data)) {
      const gasLimit = BigNumber(req.data.gasLimit, 16)
      maxFeePerGas = BigNumber(req.data.maxFeePerGas, 16)
      maxFee = maxFeePerGas.multipliedBy(gasLimit)
      maxFeeUSD = maxFee.shiftedBy(-18).multipliedBy(nativeUSD)
    } else {
      const gasLimit = BigNumber(req.data.gasLimit, 16)
      maxFeePerGas = BigNumber(req.data.gasPrice, 16)
      maxFee = maxFeePerGas.multipliedBy(gasLimit)
      maxFeeUSD = maxFee.shiftedBy(-18).multipliedBy(nativeUSD)
    }

    // const height = req.status === 'error' ? '215px' : mode === 'monitor' ? '215px' : '340px'
    // const z = mode === 'monitor' ? this.props.z + 2000 - (this.props.i * 2) : this.props.z
    const confirmations = req.tx && req.tx.confirmations ? req.tx.confirmations : 0
    const statusClass = req.status === 'error' ? 'txStatus txStatusError' : 'txStatus'
    // if (!success && !error) statusClass += ' txStatusCompact'

    const insufficientFundsMatch = originalNotice.includes('insufficient funds')
    if (insufficientFundsMatch) {
      notice = originalNotice.includes('for gas') ? 'insufficient funds for gas' : 'insufficient funds'
    }

    const txMeta = { replacement: false, possible: true, notice: '' }
    // TODO
    // if (signer locked) {
    //   txMeta.possible = false
    //   txMeta.notice = 'signer is locked'
    // }
    if (mode !== 'monitor' && req.data.nonce) {
      const r = this.store('main.accounts', this.props.accountId, 'requests')
      const requests = Object.keys(r || {}).map(key => r[key])
      const monitor = requests.filter(req => req.mode === 'monitor')
      const monitorFilter = monitor.filter(r => r.status !== 'error')
      const existingNonces = monitorFilter.map(m => m.data.nonce)
      existingNonces.forEach((nonce, i) => {
        if (req.data.nonce === nonce) {
          txMeta.replacement = true
          if (monitorFilter[i].status === 'confirming' || monitorFilter[i].status === 'confirmed') {
            txMeta.possible = false
            txMeta.notice = 'nonce used'
          } else if (
            req.data.gasPrice &&
            parseInt(monitorFilter[i].data.gasPrice, 'hex') >= parseInt(req.data.gasPrice, 'hex')
          ) {
            txMeta.possible = false
            txMeta.notice = 'gas price too low'
          } else if (
              req.data.maxPriorityFeePerGas &&
              req.data.maxFeePerGas &&
              Math.ceil(parseInt(monitorFilter[i].data.maxPriorityFeePerGas, 'hex') * 1.1) > parseInt(req.data.maxPriorityFeePerGas, 'hex') &&
              Math.ceil(parseInt(monitorFilter[i].data.maxFeePerGas, 'hex') * 1.1) > parseInt(req.data.maxFeePerGas, 'hex')
            ) {
            txMeta.possible = false
            txMeta.notice = 'gas fees too low'
          }
        }
      })
    }

    let nonce = parseInt(req.data.nonce, 'hex')
    if (isNaN(nonce)) nonce = 'TBD'

    let feeAtTime = '?.??'

    if (req && req.tx && req.tx.receipt && nativeUSD) {
      const { gasUsed, effectiveGasPrice } = req.tx.receipt
      const { type, gasPrice } = req.data

      const paidGas = effectiveGasPrice || (parseInt(type) < 2 ? gasPrice : null)

      if (paidGas) {
        const feeInWei = parseInt(gasUsed, 'hex') * parseInt(paidGas, 'hex')
        const feeInEth = feeInWei / 1e18
        const feeInUsd = feeInEth * nativeUSD
        feeAtTime = (Math.round(feeInUsd * 100) / 100).toFixed(2)
      }
    }

    const showWarning = !status && mode !== 'monitor'
    const requiredApproval = showWarning && (req.approvals || []).filter(a => !a.approved)[0]

    const recognizedActions = req.recognizedActions || []
    return (
      <div key={req.handlerId} className={requestClass}>
        {/* <TxOverlay {...this.props} overlay={this.state.overlayMode} overlayMode={this.overlayMode.bind(this)}/> */}
        {/* {this.renderStep()} */}
        {req.type === 'transaction' ? (
          <div className='approveTransaction'>
            {!!requiredApproval ? (
              <TxApproval
                req={this.props.req}
                approval={requiredApproval}
                allowOtherChain={this.allowOtherChain.bind(this)} />
            ) : null}
            <div className='approveTransactionPayload'>
              
                <div className='_txBody'>
                  <TxMainNew i={0} {...this.props} req={req} chain={this.chain} />
                  <TxMain i={1} {...this.props} req={req} chain={this.chain} />
                  {recognizedActions.map((action, i) => {
                    return <TxAction key={'action' + action.type + i} i={2 + i} {...this.props} req={req} chain={this.chain} action={action} />
                  })}
                  <TxRecipient i={3 + recognizedActions.length} {...this.props} req={req} />
                  <TxFeeNew i={4 + recognizedActions.length} {...this.props} req={req} chain={this.chain} />
                </div>
            </div>
          </div>
        ) : (
          <div className='unknownType'>{'Unknown: ' + req.type}</div>
        )}
      </div>
    )
  }
  render () {
    const { accountId, handlerId, step } = this.props
    const req = this.store('main.accounts', accountId, 'requests', handlerId)
    if (step === 'adjustFee') {
      return this.renderAdjustFee()
    } else if (step === 'viewData') {
      return this.renderViewData()
    } else if (step === 'confirm') {
      return this.renderTx()
    } else {
      return step
    }
  }
}

export default Restore.connect(TransactionRequest)
