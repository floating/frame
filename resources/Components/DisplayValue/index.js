import React from 'react'
import { displayValueData } from '../../utils/displayValue'

const Approx = ({ approximationSymbol }) => {
  return approximationSymbol && (
    <span className='displayValueApprox'>
      {approximationSymbol}
    </span>
  )
}

const FiatSymbol = ({ fiatSymbol }) => {
  return fiatSymbol && (
    <span className='displayValueFiat'>
      {fiatSymbol}
    </span>
  )
}

const Symbol = ({ currencySymbol, show }) => {
  return currencySymbol && show && (
    <span className='displayValueSymbol'>
      {currencySymbol.toUpperCase()}
    </span>
  )
}

const Main = ({ displayValue }) => {
  return (
    <span className='displayValueMain'>
      {displayValue}
    </span>
  )
}

const Unit = ({ displayUnit }) => {
  return displayUnit && (
    <span className='displayValueUnit'>
      {displayUnit.shortName}
    </span>
  )
}

export const DisplayValue = props => {

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
          <Approx approximationSymbol={approximationSymbol} />
          <FiatSymbol fiatSymbol={currencySymbol} />
        </>
      ) : (
        <>
          <Symbol currencySymbol={currencySymbol} show={currencySymbolPosition === 'first'} />
          <Approx approximationSymbol={approximationSymbol} />
        </>
      )}
      <Main displayValue={displayValue} />
      <Unit displayUnit={displayUnit} />
      <Symbol currencySymbol={currencySymbol} show={currencySymbolPosition === 'last'} />
    </div>
  )
}
