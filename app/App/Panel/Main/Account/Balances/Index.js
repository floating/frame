/* globals ResizeObserver */

import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'

import BigNumber from 'bignumber.js'

function formatBalance (balance, decimals = 8) {
  return balance
    ? new Intl.NumberFormat('us-US', {
        maximumFractionDigits: decimals
      }).format(balance)
    : '-.------'
}

function formatUsdRate (rate, decimals = 2) {
  return new Intl.NumberFormat('us-US', {
    style: 'currency',
    currency: 'usd',
    maximumFractionDigits: decimals
  }).format(rate)
}

function balance (rawBalance, rate) {
  const balance = BigNumber(rawBalance.balance || 0)
  const usdRate = BigNumber(rate)
  const totalValue = balance.times(usdRate)

  return {
    ...rawBalance,
    displayBalance: formatBalance(balance),
    price: formatUsdRate(usdRate),
    totalValue,
    displayValue: formatUsdRate(totalValue)
  }
}

function getBalances (chainId, defaultSymbol, rawBalances, rates) {
  const mainBalance = rawBalances[defaultSymbol]
  const tokenBalances = Object.values(rawBalances).filter(b => Number(b.chainId) === Number(chainId))

  const balances = [mainBalance].concat(tokenBalances)
    .filter(Boolean)
    .map(rawBalance => {
      const rate = rates[rawBalance.symbol] || {}
      const usdRate = rate.usd || 0

      return balance(rawBalance, usdRate)
    })
    .sort((a, b) => {
      if (a.symbol === defaultSymbol) return -1
      if (b.symbol === defaultSymbol) return 1
      console.log({ a: a.totalValue, b: b.totalValue, tot: b.totalValue.minus(a.totalValue).toNumber() })
      return b.totalValue.minus(a.totalValue).toNumber()
    })

  const totalValue = balances.reduce((a, b) => a.plus(b.totalValue), BigNumber(0))

  return { balances, totalDisplayValue: formatUsdRate(totalValue, 2) }
}

class Balances extends React.Component {
  constructor (...args) {
    super(...args)
    this.moduleRef = React.createRef()
    this.resizeObserver = new ResizeObserver(() => {
      if (this.moduleRef && this.moduleRef.current) {
        link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: this.moduleRef.current.clientHeight })
      }
    })
    this.state = {
      openActive: false,
      open: false,
      selected: 0,
      shadowTop: 0,
      expand: false
    }
  }

  componentDidMount () {
    this.resizeObserver.observe(this.moduleRef.current)
  }
  // componentWillUnmount () {
  //   this.resizeObserver.disconnect()
  // }

  renderBalance (symbol, balanceInfo, i) {
    return (
      <div className='signerBalance' key={symbol} onMouseDown={() => this.setState({ selected: i })}>
        <div className='signerBalanceLogo'>
          <img src={balanceInfo.logoURI} />
        </div>
        <div className='signerBalanceCurrency'>
          <span>{symbol.toUpperCase()}</span><span className='signerBalanceCurrencySmall'>{balanceInfo.name}</span>
        </div>
        <div className='signerBalanceName'>
          <span className='signerBalanceCurrentPrice'>{balanceInfo.price}</span>
        </div>
        <div className='signerBalanceValue' style={(balanceInfo.displayBalance || '0').length >= 12 ? { fontSize: '15px', top: '14px' } : {}}>
          {balanceInfo.displayBalance}
        </div>
        <div className='signerBalanceEquivalent'>
          {balanceInfo.displayValue}
        </div>
      </div>
    )
  }

  render () {
    const address = this.store('main.accounts', this.props.id, 'address')
    const { type, id: chainId } = this.store('main.currentNetwork')
    const currentSymbol = this.store('main.networks', type, chainId, 'symbol') || 'ETH'
    const storedBalances = this.store('main.accounts', address, 'balances') || {}

    const rates = this.store('external.rates')

    let { balances, totalDisplayValue } = getBalances(
      chainId,
      currentSymbol.toLowerCase(),
      storedBalances,
      rates
    )

    if (!this.state.expand) {
      balances = balances.slice(0, 5)
    }

    return (
      <div ref={this.moduleRef} className='balancesBlock'>
        <div className='moduleHeader'>account balances</div>
        {balances.map(({ symbol, ...balance }, i) => this.renderBalance(symbol, balance, i))}
        {
          balances.length <= 1 && this.state.expand
            ? (
              <div className='signerBalanceNoTokens'>
                No other token balances found
              </div>
              )
            : null
          }
        <div className='signerBalanceTotal'>
          <div className='signerBalanceShowAll' onMouseDown={() => this.setState({ expand: !this.state.expand })}>
            {this.state.expand ? 'Show Less' : 'Show All'}
          </div>
          <div className='signerBalanceTotalText'>
            <div className='signerBalanceTotalLabel'>
              {'Total: '}
            </div>
            <div className='signerBalanceTotalValue'>
              {totalDisplayValue}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Balances)
