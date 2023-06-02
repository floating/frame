import React from 'react'
import { DisplayFiatPrice, DisplayValue } from '../../../../../resources/Components/DisplayValue'
import RingIcon from '../../../../../resources/Components/RingIcon'

import useStore from '../../../../../resources/Hooks/useStore'

const displayName = (name = '') => {
  if (name.length > 24) {
    return name.slice(0, 22) + '..'
  }
  return name
}

const displayChain = (name = '') => {
  if (name.length > 14) {
    return name.slice(0, 12) + '..'
  }
  return name
}

const Balance = (props) => {
  const { symbol = '', balance, i, scanning, chainId, address } = props

  const chain = useStore('main.networks.ethereum', chainId)
  const chainColor = useStore('main.networksMeta.ethereum', chainId, 'primaryColor')

  const displaySymbol = symbol.substring(0, 10)
  const { priceChange, decimals, balance: balanceValue, usdRate: currencyRate, media } = balance
  const logoURI = media.cdn?.thumb || media.source
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
  if (name.length > 21) name = name.substr(0, 19) + '..'

  const displayPriceChange = () => {
    if (!priceChange) {
      return ''
    }
    return `(${direction === 1 ? '+' : ''}${priceChange}%)`
  }

  const { name: chainName = '', isTestnet = false } = chain

  const imageURL = logoURI

  const isNative = address === '0x0000000000000000000000000000000000000000'
  const isEth = isNative && [1, 3, 4, 5, 10, 42, 42161, 11155111].includes(chainId)

  return (
    <div className={'signerBalance'} key={symbol} onMouseDown={() => this.setState({ selected: i })}>
      {scanning && <div className='signerBalanceLoading' style={{ animationDelay: 0.15 * i + 's' }} />}
      <div className='signerBalanceInner' style={{ opacity: !scanning ? 1 : 0 }}>
        <div className='signerBalanceIcon'>
          <RingIcon
            img={!isEth && !isTestnet && imageURL}
            svgName={isEth && 'eth'}
            alt={symbol.toUpperCase()}
            color={chainColor ? `var(--${chainColor})` : ''}
          />
        </div>
        <div className='signerBalanceChain'>
          <span style={{ color: chainColor ? `var(--${chainColor})` : '' }}>{displayChain(chainName)}</span>
          <span>{displayName(name)}</span>
        </div>
        <div className='signerBalanceMain'>
          <div style={{ letterSpacing: '1px' }}>{displaySymbol}</div>
          <div className='signerBalanceCurrencyLine' />
          <div>
            <DisplayValue type='ether' value={balanceValue} valueDataParams={{ decimals }} />
          </div>
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

export default Balance
