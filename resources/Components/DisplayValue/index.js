import React from 'react'
import { displayValueData } from '../../utils/displayValue'
import BigNumber from 'bignumber.js'

function isDisplayValueData(obj) {
  return obj?.fiat && obj?.ether && obj?.gwei && obj?.wei && BigNumber.isBigNumber(obj.bn)
}

const ApproximateValue = ({ approximationSymbol }) => (
  <span className='displayValueApprox'>{approximationSymbol}</span>
)

const FiatSymbol = ({ fiatSymbol }) => <span className='displayValueFiat'>{fiatSymbol}</span>

const Symbol = ({ currencySymbol }) => (
  <span className='displayValueSymbol'>{currencySymbol.toUpperCase()}</span>
)

const Main = ({ displayValue }) => <span className='displayValueMain'>{displayValue}</span>

const Unit = ({ displayUnit }) => <span className='displayValueUnit'>{displayUnit.shortName}</span>

export const DisplayCoinBalance = ({ amount, symbol, decimals }) => (
  <DisplayValue
    type='ether'
    value={amount}
    currencySymbol={symbol}
    currencySymbolPosition='last'
    valueDataParams={{ decimals }}
  />
)

export const DisplayFiatPrice = ({ decimals, currencyRate, isTestnet }) => (
  <DisplayValue
    type='fiat'
    value={`1e${decimals}`}
    valueDataParams={{ decimals, currencyRate, isTestnet, displayFullValue: true }}
    currencySymbol='$'
  />
)

export const DisplayValue = (props) => {
  const {
    value,
    valueDataParams,
    currencySymbol,
    type = 'ether',
    displayDecimals = true,
    currencySymbolPosition = 'first'
  } = props

  const data = isDisplayValueData(value) ? value : displayValueData(value, valueDataParams)

  const { approximationSymbol = '', displayValue, displayUnit } = data[type]({ displayDecimals })

  return (
    <div className='displayValue' data-testid='display-value'>
      {type === 'fiat' ? (
        <>
          {approximationSymbol && <ApproximateValue approximationSymbol={approximationSymbol} />}
          {currencySymbol && <FiatSymbol fiatSymbol={currencySymbol} />}
        </>
      ) : (
        <>
          {currencySymbol && currencySymbolPosition === 'first' && <Symbol currencySymbol={currencySymbol} />}
          {approximationSymbol && <ApproximateValue approximationSymbol={approximationSymbol} />}
        </>
      )}
      <Main displayValue={displayValue} />
      {displayUnit && <Unit displayUnit={displayUnit} />}
      {currencySymbol && currencySymbolPosition === 'last' && <Symbol currencySymbol={currencySymbol} />}
    </div>
  )
}
