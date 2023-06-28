import React from 'react'
import { DisplayFiatPrice, DisplayValue } from '../../../../../resources/Components/DisplayValue'
import RingIcon from '../../../../../resources/Components/RingIcon'
import useStore from '../../../../../resources/Hooks/useStore'
import { NATIVE_CURRENCY } from '../../../../../resources/constants'

const displayName = (name = '') => (name.length > 24 ? name.slice(0, 22) + '..' : name)
const displayChain = (name = '') => (name.length > 14 ? name.slice(0, 12) + '..' : name)

const Balance = ({ symbol = '', balance, i, scanning, chainId, address }) => {
  const isNative = address === NATIVE_CURRENCY

  const chain = useStore('main.networks.ethereum', chainId)
  const chainColor = useStore('main.networksMeta.ethereum', chainId, 'primaryColor')

  const displaySymbol = symbol.substring(0, 10)
  const {
    media = { source: '', cdn: {} }, //This is necessary as CurrencyBalances populated by the scanner do not have media...
    priceChange,
    decimals,
    balance: balanceValue,
    usdRate: currencyRate
  } = balance

  const change = parseFloat(priceChange)
  const direction = change < 0 ? -1 : change > 0 ? 1 : 0
  let priceChangeClass = `signerBalanceCurrentPriceChange ${
    direction === 1
      ? 'signerBalanceCurrentPriceChangeUp'
      : direction === -1
      ? 'signerBalanceCurrentPriceChangeDown'
      : ''
  }`
  let name = balance.name
  if (name.length > 21) name = name.substr(0, 19) + '..'

  const displayPriceChange = () => (priceChange ? `(${direction === 1 ? '+' : ''}${priceChange}%)` : '')

  const { name: chainName = '', isTestnet = false } = chain
  const imageURL = media.cdn.thumb || media.cdn.main || media.source //TODO: should proxy non-cdn assets
  const isEth = isNative && [1, 3, 4, 5, 10, 42, 42161, 11155111].includes(chainId)

  return (
    <div className={'signerBalance'} key={symbol}>
      {scanning && <div className='signerBalanceLoading' style={{ animationDelay: `${0.15 * i}s` }} />}
      <div className='signerBalanceInner' style={{ opacity: !scanning ? 1 : 0 }}>
        <div className='signerBalanceIcon'>
          <RingIcon
            img={!isEth && !isTestnet && imageURL}
            thumb={true}
            frozen={true}
            media={!isEth && media}
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
