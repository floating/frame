import React from 'react'
import Restore from 'react-restore'

import RequestItem from '../../../../../../../resources/Components/RequestItem'
import TxOverview from './overview'

class TxMain extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      copied: false
    }
  }

  render() {
    const req = this.props.req
    const chainId = parseInt(req.data.chainId, 16)

    const chainName = this.store('main.networks.ethereum', chainId, 'name')
    const currentSymbol = this.store('main.networksMeta.ethereum', chainId, 'nativeCurrency.symbol') || '?'

    const txMeta = { replacement: false, possible: true, notice: '' }

    const { accountId } = this.props

    // TODO
    // if (signer locked) {
    //   txMeta.possible = false
    //   txMeta.notice = 'signer is locked'
    // }
    if (req.mode !== 'monitor' && req.data.nonce) {
      const r = this.store('main.accounts', this.props.accountId, 'requests')
      const requests = Object.keys(r || {}).map((key) => r[key])
      const monitor = requests.filter((req) => req.mode === 'monitor')
      const monitorFilter = monitor.filter((r) => r.status !== 'error')
      const existingNonces = monitorFilter.map((m) => m.data.nonce)
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
            Math.ceil(parseInt(monitorFilter[i].data.maxPriorityFeePerGas, 'hex') * 1.1) >
              parseInt(req.data.maxPriorityFeePerGas, 'hex') &&
            Math.ceil(parseInt(monitorFilter[i].data.maxFeePerGas, 'hex') * 1.1) >
              parseInt(req.data.maxFeePerGas, 'hex')
          ) {
            txMeta.possible = false
            txMeta.notice = 'gas fees too low'
          }
        }
      })
    }

    const { primaryColor, icon } = this.store('main.networksMeta.ethereum', chainId)
    const originName = this.store('main.origins', req.origin, 'name')
    return (
      <div className='_txMain' style={{ animationDelay: 0.1 * this.props.i + 's' }}>
        <div className='_txMainInner'>
          <div
            className='_txMainBackground'
            style={{ background: `linear-gradient(135deg, var(--${primaryColor}) 0%, transparent 100%)` }}
          />
          <RequestItem
            req={req}
            account={accountId}
            handlerId={req.handlerId}
            title={`${chainName} Transaction`}
            color={primaryColor ? `var(--${primaryColor})` : ``}
            img={icon}
            headerMode={true}
          >
            <TxOverview
              req={req}
              chainName={chainName}
              chainColor={primaryColor}
              symbol={currentSymbol}
              txMeta={txMeta}
              originName={originName}
            />
          </RequestItem>
        </div>
      </div>
    )
  }
}

export default Restore.connect(TxMain)
