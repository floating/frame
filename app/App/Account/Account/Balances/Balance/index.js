import React from 'react'
import Restore from 'react-restore'

import { DisplayFiatPrice, DisplayValue } from '../../../../../../resources/Components/DisplayValue'
import RingIcon from '../../../../../../resources/Components/RingIcon'

class Balance extends React.Component {
  render() {
    const { symbol, balance, i, scanning, chainId } = this.props
    const {
      priceChange,
      decimals,
      balance: balanceValue,
      usdRate: currencyRate,
      logoURI,
      price,
      displayBalance = '0'
    } = balance
    const change = parseFloat(priceChange)
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

    const displayPriceChange = () => {
      if (!priceChange) {
        return ''
      }
      return `(${direction === 1 ? '+' : ''}${priceChange}%)`
    }
    const chain = this.store('main.networks.ethereum', chainId)
    const { name: chainName = '', isTestnet = false } = chain
    const chainColor = this.store('main.networksMeta.ethereum', chainId, 'primaryColor')

    const ethMatch = logoURI.indexOf('/coins/images/279/large/ethereum.png') > -1

    return (
      <div
        className={i === 0 ? 'signerBalance signerBalanceBase' : 'signerBalance'}
        key={symbol}
        onMouseDown={() => this.setState({ selected: i })}
      >
        {scanning && <div className='signerBalanceLoading' style={{ animationDelay: 0.15 * i + 's' }} />}
        <div className='signerBalanceInner' style={{ opacity: !scanning ? 1 : 0 }}>
          <div className='signerBalanceIcon'>
            <RingIcon
              img={symbol.toUpperCase() !== 'ETH' && !isTestnet && !ethMatch && logoURI}
              alt={symbol.toUpperCase()}
              color={chainColor ? `var(--${chainColor})` : ''}
            />
          </div>
          <div className='signerBalanceChain' style={{ color: chainColor ? `var(--${chainColor})` : '' }}>
            {chainName}
          </div>
          <div className='signerBalanceCurrency'>{name}</div>
          <div className='signerBalanceValue'>
            <DisplayValue
              type='ether'
              value={balanceValue}
              valueDataParams={{ decimals }}
              currencySymbol={symbol}
            />
          </div>
          <div className='signerBalancePrice'>
            <div className='signerBalanceOk'>
              <span className='signerBalanceCurrentPrice'>
                <DisplayFiatPrice decimals={decimals} currencyRate={currencyRate} isTestnet={isTestnet} />
              </span>
              <span className={priceChangeClass}>
                <span>{displayPriceChange()}</span>
              </span>
            </div>
            <DisplayValue
              type='fiat'
              value={balanceValue}
              valueDataParams={{ decimals, currencyRate, isTestnet }}
              currencySymbol='$'
              displayDecimals={false}
            />
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Balance)
