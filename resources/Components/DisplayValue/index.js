import React from 'react'
import { displayValueData } from '../../utils/displayValue'

const CurrencySymbol = ({ symbol }) => <span className='currencySymbol'>{symbol}</span>

export const DisplayValue = ({ value, valueData, valueDataParams, currencySymbol, type = 'ether', displayDecimals = true, currencySymbolPosition = 'first' }) => {
  const data = valueData || displayValueData(value, valueDataParams)
  const { approximationSymbol = '', displayValue, displayUnit } = data[type]({ displayDecimals })
  
  return <div className='displayValue' data-testid='display-value'>
    {approximationSymbol && <span className='approximation'>{approximationSymbol}</span>}
    {currencySymbol && currencySymbolPosition === 'first' && <CurrencySymbol symbol={currencySymbol} />}
    <span className='value'>{displayValue}</span>
    {displayUnit && <span className='unit'>{displayUnit.shortName}</span>}
    {currencySymbol && currencySymbolPosition === 'last' && <CurrencySymbol symbol={currencySymbol} />}
  </div>
}
