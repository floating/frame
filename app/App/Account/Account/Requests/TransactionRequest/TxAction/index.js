import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../../resources/link'
import svg from '../../../../../../../resources/svg'
import utils from 'web3-utils'
import BigNumber from 'bignumber.js'
import Transfer from './erc20/transfer'
import Recipient from './recipient'
import Destination from './destination'
import Register from './ens/register'


const ActionBox = ({ title, subHead, animationIndex, children }) => {
  return (
    <div className='_txMain' style={{ animationDelay: (0.1 * animationIndex) + 's' }}>
      <div className='_txMainInner'>
        <div className='_txLabel'>
          <div>
            <span>{title}</span>
            {subHead &&
              <span style={{ 
                opacity: 0.8, 
                fontSize: '9px',
                position: 'relative',
                top: '-1px',
                left: '4px'
              }}>
                {`(${subHead})`}
              </span>
            }
          </div>
        </div>
        <div className='_txMainValues'>
          {children}
        </div>
      </div>
    </div>
  )
}

class TxSending extends React.Component {
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
    const contract = req.data.to.toLowerCase()
    const chainId = parseInt(req.data.chainId, 16)
    const chainName = this.store('main.networks.ethereum', chainId, 'name')

    const { action } = this.props
    console.log('ACTION', JSON.stringify(action))
    const [actionClass, actionType] = action.id.split(':')

    if (actionClass === 'erc20') {
      if (actionType === 'transfer') {
        const { amount, decimals, name, recipient: recipientAddress, symbol, recipientType, recipientEns } = action.data || {}
        const value = new BigNumber(amount) 
        const displayValue = value.dividedBy('1e' + decimals).toFixed(6)
        // const ensName = (recipientEns && recipientEns.length < 25) ? recipientEns : ''

        const layer = this.store('main.networks', this.props.chain.type, this.props.chain.id, 'layer')    
        const rate = this.store('main.rates', contract)
        const rateUSD = rate && rate.usd && layer !== 'testnet' ? rate.usd.price : 0
  
        const destination = recipientType && <Destination chain={chainName} recipientType={recipientType} />
        const recipient = recipientAddress && 
          <Recipient
            address={recipientAddress}
            ens={recipientEns}
            copyAddress={(copied) => link.send('tray:clipboardData', copied)}
          />
  
        return (
          <ActionBox title={`Sending ${symbol}`} subHead={name} animationIndex={this.props.i}>
            <Transfer symbol={symbol} rate={rateUSD} displayValue={displayValue} />
            {destination}
            {recipient}
          </ActionBox>
        )
      }
    }


    if (actionClass === 'ens') {
      if (actionType === 'register') {
        const { address, domain } = action.data || {}

        return (
          <ActionBox title={'Registering ENS Domain'} animationIndex={this.props.i}>
            <Register
              address={address} domain={domain} copyAddress={(copied) => link.send('tray:clipboardData', copied)} />
          </ActionBox>
        )
      }
    }

    return null
  }
}

export default Restore.connect(TxSending)
