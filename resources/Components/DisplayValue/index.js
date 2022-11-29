import React from 'react'
import { displayValueData } from '../../utils/displayValue'

const ApproximateValue = ({ approximationSymbol }) => (
  <span className='displayValueApprox'>
    {approximationSymbol}
  </span>
)

const FiatSymbol = ({ fiatSymbol }) => (
  <span className='displayValueFiat'>
    {fiatSymbol}
  </span>
)


const Symbol = ({ currencySymbol }) => (
  <span className='displayValueSymbol'>
    {currencySymbol.toUpperCase()}
  </span>
)

const Main = ({ displayValue }) => (
  <span className='displayValueMain'>
    {displayValue}
  </span>
)

const Unit = ({ displayUnit }) => (
  <span className='displayValueUnit'>
    {displayUnit.shortName}
  </span>
)

export const DisplayValue = (props) => {
  const {
    value, 
    valueData, 
    valueDataParams, 
    currencySymbol,
    type = 'ether', 
    displayDecimals = true, 
    currencySymbolPosition = 'first'
  } = props

  const data = valueData || displayValueData(value, valueDataParams)

  const { 
    approximationSymbol = '', 
    displayValue, 
    displayUnit 
  } = data[type]({ displayDecimals })
  
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
