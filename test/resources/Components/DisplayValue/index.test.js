import React from 'react'

import { setupComponent } from '../../../componentSetup'
import { DisplayValue } from '../../../../resources/Components/DisplayValue'
import { displayValueData } from '../../../../resources/utils/displayValue'

it('should render the expected content when provided with valueData', () => {
  const valueData = new displayValueData(356e28)
  const { getByTestId } = setupComponent(<DisplayValue valueData={valueData} />)
  const displayValue = getByTestId('display-value')

  expect(displayValue.textContent).toBe('3.56T')
})

it('should render the expected content when provided with a value and valueDataParams', () => {
  const { getByTestId } = setupComponent(<DisplayValue value={356e24} valueDataParams={{ decimals: 12 }} />)
  const displayValue = getByTestId('display-value')

  expect(displayValue.textContent).toBe('356T')
})

it('should render a currency symbol before the value when specified', () => {
  const { getByTestId } = setupComponent(<DisplayValue value={356e18} currencySymbol={'MYTOKEN'} />)
  const displayValue = getByTestId('display-value')

  expect(displayValue.textContent).toBe('MYTOKEN356')
})

it('should render a currency symbol after the value when specified with currencySymbolPosition', () => {
  const { getByTestId } = setupComponent(
    <DisplayValue value={356e18} currencySymbol={'MYTOKEN'} currencySymbolPosition='last' />
  )
  const displayValue = getByTestId('display-value')

  expect(displayValue.textContent).toBe('356MYTOKEN')
})

it('should render a fiat value', () => {
  const { getByTestId } = setupComponent(
    <DisplayValue
      value={356e28}
      valueDataParams={{ currencyRate: { price: 1.5 } }}
      type='fiat'
      currencySymbol='$'
    />
  )
  const displayValue = getByTestId('display-value')

  expect(displayValue.textContent).toBe('$5.34T')
})

it('should not display decimals on a small fiat value when displayDecimals is set to false', () => {
  const { getByTestId } = setupComponent(
    <DisplayValue
      value={356e16}
      displayDecimals={false}
      valueDataParams={{ currencyRate: { price: 1.5 } }}
      type='fiat'
      currencySymbol='$'
    />
  )
  const displayValue = getByTestId('display-value')

  expect(displayValue.textContent).toBe('$5')
})

it('should not render a shorthand unit when displayFullValue is specified on a fiat value', () => {
  const { getByTestId } = setupComponent(
    <DisplayValue
      value={356e28}
      valueDataParams={{ displayFullValue: true, currencyRate: { price: 1.5 } }}
      type='fiat'
      currencySymbol='$'
    />
  )
  const displayValue = getByTestId('display-value')

  expect(displayValue.textContent).toBe('$5,340,000,000,000.00')
})

it('should render an ether value', () => {
  const { getByTestId } = setupComponent(<DisplayValue value={356e28} type='ether' currencySymbol='ETH' />)
  const displayValue = getByTestId('display-value')

  expect(displayValue.textContent).toBe('ETH3.56T')
})

it('should not display decimals on a small ether value when displayDecimals is set to false', () => {
  const { getByTestId } = setupComponent(
    <DisplayValue value={356e16} displayDecimals={false} type='ether' currencySymbol='ETH' />
  )
  const displayValue = getByTestId('display-value')

  expect(displayValue.textContent).toBe('ETH3')
})

it('should not render a shorthand unit when displayFullValue is specified on an ether value', () => {
  const { getByTestId } = setupComponent(
    <DisplayValue
      value={356e28}
      valueDataParams={{ displayFullValue: true }}
      type='ether'
      currencySymbol='ETH'
    />
  )
  const displayValue = getByTestId('display-value')

  expect(displayValue.textContent).toBe('ETH3,560,000,000,000')
})
