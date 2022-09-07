import React from 'react'
import Restore from 'react-restore'

import chainMeta from '../../../../../../resources/chainMeta'
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

    return (
      <div className={i === 0 ? 'signerBalance signerBalanceBase' : 'signerBalance'} key={symbol} onMouseDown={() => this.setState({ selected: i })}>
        <div className='signerBalanceInner' style={{ opacity: !scanning ? 1 : 0 }}>
          <div className='signerBalanceIcon'>
            <RingIcon 
              img={balance.logoURI && symbol.toUpperCase() !== 'ETH' && `https://proxy.pylon.link?type=icon&target=${encodeURIComponent(balance.logoURI)}`}
              alt={symbol.toUpperCase()}
              color={chainMeta[chainHex] ? chainMeta[chainHex].primaryColor : '' }
            />
          </div>
          <div 
            className='signerBalanceChain'
            style={{ color: chainMeta[chainHex] ? chainMeta[chainHex].primaryColor : '' }}
          >
            {chainMeta[chainHex] ? chainMeta[chainHex].name : '' }
          </div>
          <div className='signerBalanceCurrency'>
            {name}
          </div>
          <div className='signerBalanceValue' style={(balance.displayBalance || '0').length >= 12 ? { fontSize: '15px', top: '10px' } : {}}>
            <span 
              className='signerBalanceSymbol'
            >
              {symbol.toUpperCase()}
            </span>
            <span
              style={(balance.displayBalance || '0').length >= 12 ? { marginTop: '-3px' } : {}}
            >
              {balance.displayBalance}
            </span>
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
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Balance)
