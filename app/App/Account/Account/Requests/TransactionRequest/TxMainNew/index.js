import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../../resources/link'
import utils from 'web3-utils'

import RequestItem from '../../../../../../../resources/Components/RequestItem'
import TxOverview from './overview'

class TxRecipient extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {
      copied: false
    }
  }
  copyAddress (data) {
    link.send('tray:clipboardData', data)
    this.setState({ copied: true })
    setTimeout(_ => this.setState({ copied: false }), 1000)
  }
  hexToDisplayValue (hex) {
    return (Math.round(parseFloat(utils.fromWei(hex, 'ether')) * 1000000) / 1000000).toFixed(6)
  }

  render () {
    const req = this.props.req
    const chainId = parseInt(req.data.chainId, 16)

    const chainName = this.store('main.networks.ethereum', chainId, 'name')
    const currentSymbol = this.store('main.networks.ethereum', chainId, 'symbol') || '?'

    const txMeta = { replacement: false, possible: true, notice: '' }

    const { accountId } = this.props
    const chainColor = this.store('main.networksMeta.ethereum', chainId, 'primaryColor')

    // TODO
    // if (signer locked) {
    //   txMeta.possible = false
    //   txMeta.notice = 'signer is locked'
    // }
    if (req.mode !== 'monitor' && req.data.nonce) {
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

    return (
      <div className='_txMain' style={{ animationDelay: (0.1 * this.props.i) + 's' }}>
        <div className='_txMainInner'>
          <RequestItem 
            req={req}
            account={accountId}
            handlerId={req.handlerId}
            title={`${chainName} Transaction`}
            color={`var(--${chainColor})`}
            svgLookup={{ name: chainName }}
            headerMode={true}
          />

          <TxOverview req={req} chainName={chainName} symbol={currentSymbol} txMeta={txMeta} />

        </div>
      </div>
    )
  }
}

{/* <div className='transactionToAddressFull' onMouseDown={this.copyAddress.bind(this, req.data.to)}>
{this.state.copied ? <span>{'Copied'}{svg.octicon('clippy', { height: 14 })}</span> : req.data.to}
</div> */}

export default Restore.connect(TxRecipient)
