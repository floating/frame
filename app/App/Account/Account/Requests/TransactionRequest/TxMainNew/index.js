import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../../resources/link'
import svg from '../../../../../../../resources/svg'
import utils from 'web3-utils'

import BigNumber from 'bignumber.js'

import chainMeta from '../../../../../../../resources/chainMeta'
import RequestItem from '../../../../../../../resources/Components/RequestItem'


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

  renderRecognizedActions (req) {
    if (req && req.recognizedActions) {
      return req.recognizedActions.map(action => {
        const { type, data } = action
        if (type === 'erc20:transfer') {
          const amount = new BigNumber(data.amount) 
          const decimals = new BigNumber('1e' + data.decimals)
          const displayAmount = amount.dividedBy(decimals)
          return (
            <div className='_txDescriptionSummary'>
              {`Sending ${displayAmount.toString()} ${data.symbol}`}
            </div>
          )
        }
        return null
      })
    }
    return null
  }

  render () {
    const req = this.props.req
    const chainId = parseInt(req.data.chainId, 16)

    const chainName = this.store('main.networks.ethereum', chainId, 'name')
    const currentSymbol = this.store('main.networks.ethereum', chainId, 'symbol') || '?'

    const txMeta = { replacement: false, possible: true, notice: '' }

    const { accountId } = this.props
    const hexId = '0x' + parseInt(req.data.chainId).toString('16')

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
            title={chainName + ' Transaction'}
            color={chainMeta[hexId] ? chainMeta[hexId].primaryColor : ''}
            img={chainMeta[hexId] ? chainMeta[hexId].icon : ''}
            headerMode={true}
          />
          <div className='_txMainValues'>
            <div className='_txMainValue _txMainValueClickable' onClick={() => {
              link.send('nav:update', 'panel', { data: { step: 'viewData' } })
            }}>
              <div className='_txDescription'>
                {!req.to && req.data.data && req.data.data !== '0x' && req.data.data !== '0x0' ? (
                  <div className='_txDescriptionSummary'>
                    <div>{`Deploying Contract`}</div>
                    <div>{`on ${chainName}`}</div>
                  </div>
                ) : req.recipientType === 'external' ? (
                  <div className='_txDescriptionSummary'>
                    {req.data.value && req.data.value !== '0x' && req.data.value !== '0x0' ? (
                      <div>{`Sending ${currentSymbol}`}</div>
                    ) : req.data.data && req.data.data !== '0x' && req.data.data !== '0x0' ? (
                      <div>{`Sending Data`}</div>
                    ) : (
                      <div>{`Empty Transaction`}</div>
                    )}
                    <div>{`on ${chainName}`}</div>
                  </div>
                ) : ( // Recipient is contract
                  <div className='_txDescriptionSummary'>
                    {req.data.value && req.data.value !== '0x' && req.data.value !== '0x0' ? (
                      <div>{`Sending ${currentSymbol}`}</div>
                    ) : null}
                    {req.recognizedActions.length ? (
                      this.renderRecognizedActions(req)
                    ) : req.decodedData && req.decodedData.method ? (
                      <div>{`Calling Contract Method ${req.decodedData.method}`}</div>
                    ) : null}
                    <div>{`on ${chainName}`}</div>
                  </div>
                )}
              </div>
            </div>
            {txMeta.replacement ? (
              txMeta.possible ? (
                <div className='_txMainTag _txMainTagWarning'>
                  valid replacement
                </div>
              ) : (
                <div className='_txMainTag _txMainTagWarning'>
                  {txMeta.notice || 'invalid duplicate'}
                </div>
              )
            ) : null}
            {req.data.data && req.data.data !== '0x' && req.data.data !== '0x0' ? (
              <div className='_txMainTag _txMainTagWarning'>
                {'Transaction includes data'}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    )
  }
}

{/* <div className='transactionToAddressFull' onMouseDown={this.copyAddress.bind(this, req.data.to)}>
{this.state.copied ? <span>{'Copied'}{svg.octicon('clippy', { height: 14 })}</span> : req.data.to}
</div> */}

export default Restore.connect(TxRecipient)
