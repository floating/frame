import React from 'react'
import Restore from 'react-restore'

import { DisplayValue } from '../../../../../../resources/Components/DisplayValue'
import RingIcon from '../../../../../../resources/Components/RingIcon'

import svg from '../../../../../../resources/svg'
class Balance extends React.Component {
  // constructor (...args) {
  //   super(...args)
  //   this.state = {
  //     initialMount: true
  //   }
  // }

  // componentDidMount () {
  //   setTimeout(() => {
  //     this.setState({ initialMount: false })
  //   }, 200)
  // }

  render () {
    const { symbol, balance, i, scanning, chainId } = this.props
    const change = parseFloat(balance.priceChange)
    const direction = change < 0 ? -1 : change > 0 ? 1 : 0
    let priceChangeClass = 'signerBalanceCurrentPriceChange'
    if (direction !== 0) {
      if (direction === 1) {
        priceChangeClass += ' signerBalanceCurrentPriceChangeUp'
      } else {
        priceChangeClass += ' signerBalanceCurrentPriceChangeDown'
      }
    }
    let name = balance.name
    if (name.length > 19) name = name.substr(0, 17) + '..'

    const chainHex = '0x' + chainId.toString(16)
    const priceChange = () => {
      if (!balance.priceChange) {
        return ''
      }
      return `(${direction === 1 ? '+' : ''}${balance.priceChange}%)`
    }
    const chain = this.store('main.networks.ethereum', chainId)
    const chainName = chain ? chain.name : ''
    const chainColor = this.store('main.networksMeta.ethereum', chainId, 'primaryColor')

    return (
      <div className={i === 0 ? 'signerBalance signerBalanceBase' : 'signerBalance'} key={symbol} onMouseDown={() => this.setState({ selected: i })}>
        <div className='signerBalanceLoading' style={{ opacity: !scanning ? 0 : 1, animationDelay: (0.15 * i) + 's' }} />
        <div className='signerBalanceInner' style={{ opacity: !scanning ? 1 : 0 }}>
          <div className='signerBalanceIcon'>
            <RingIcon 
              img={symbol.toUpperCase() !== 'ETH' && balance.logoURI}
              alt={symbol.toUpperCase()}
              color={chainColor ? `var(--${chainColor})` : ''}
            />
          </div>
          <div 
            className='signerBalanceChain'
            style={{ color: chainColor ? `var(--${chainColor})` : '' }}
          >
            {chainName}
          </div>
          <div className='signerBalanceCurrency'>
            {name}
          </div>
          <div className='signerBalanceValue' style={(balance.displayBalance || '0').length >= 12 ? { fontSize: '15px', top: '10px' } : {}}>
            {/* <span 
              className='signerBalanceSymbol'
            >
              {symbol.toUpperCase()}
            </span>
            <span
              style={(balance.displayBalance || '0').length >= 12 ? { marginTop: '-3px' } : {}}
            >
              {balance.displayBalance}
            </span> */}
            <DisplayValue type='ether' value={balance.balance} valueDataParams={{ decimalsOverride: 6, decimals: balance.decimals }} currencySymbol={symbol.toUpperCase()} />
          </div>
          <div className='signerBalancePrice'>
            <div className='signerBalanceOk'>
              <span className='signerBalanceCurrentPrice'>
                {svg.usd(10)}{balance.price}
              </span>
              <span className={priceChangeClass}>
                <span>{priceChange()}</span>
              </span>
            </div>
            <div className='signerBalanceCurrentValue'>
              {svg.usd(10)}{balance.displayValue}
            </div>
            <DisplayValue type='fiat' value={balance.balance} valueDataParams={{ currencyRate: balance.usdRate, isTestnet: chain.isTestnet }} currencySymbol='$' />
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Balance)
