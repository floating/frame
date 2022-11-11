import React from 'react'
import { displayValueData } from '../../utils/displayValue'

export const DisplayValue = ({ value, valueData, valueDataParams, currencySymbol, type = 'ether', currencySymbolPosition = 'first' }) => {
  const data = valueData || displayValueData(value, valueDataParams)
  const { approximationSymbol = '', displayValue, displayUnit } = data[type]
  const CurrencySymbol = () => <span className='currencySymbol'>{currencySymbol}</span>

  return <div className='displayValue'>
    <span className='approximation'>{approximationSymbol}</span>
    {currencySymbolPosition === 'first' && <CurrencySymbol />}
    <span className='value'>{displayValue}</span>
    <span className='unit'>{displayUnit ? displayUnit.shortName : ''}</span>
    {currencySymbolPosition === 'last' && <CurrencySymbol />}
  </div>
}
