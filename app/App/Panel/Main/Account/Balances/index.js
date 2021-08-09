/* globals ResizeObserver */

import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'

import BigNumber from 'bignumber.js'

function formatBalance (balance, decimals = 8) {
  return balance
    ? new Intl.NumberFormat('us-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
      }).format(balance.toFixed(decimals, BigNumber.ROUND_FLOOR))
    : '-.------'
}

function formatUsdRate (rate, decimals = 2) {
  return new Intl.NumberFormat('us-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(rate.toFixed(decimals, BigNumber.ROUND_FLOOR))
}

function balance (rawBalance, quote = {}) {
  const balance = BigNumber(rawBalance.balance || 0)
  const usdRate = BigNumber(quote.price || 0)
  const totalValue = balance.times(usdRate)
  const balanceDecimals = Math.max(2, usdRate.shiftedBy(1).toFixed(0, BigNumber.ROUND_DOWN).length)

  return {
    ...rawBalance,
    displayBalance: formatBalance(balance, balanceDecimals),
    price: formatUsdRate(usdRate),
    priceChange: BigNumber(quote['change24hr'] || 0).toFixed(2),
    totalValue,
    displayValue: formatUsdRate(totalValue, 0)
  }
}

class Balances extends React.Component {
  constructor (...args) {
    super(...args)
    this.moduleRef = React.createRef()
    if (!this.props.expanded) {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.moduleRef && this.moduleRef.current) {
          clearTimeout(this.resizeTimer)
          this.resizeTimer = setTimeout(() => {
            link.send('tray:action', 'updateAccountModule', this.props.moduleId, { height: this.moduleRef.current.clientHeight })
          }, 100)
        }
      })
    }

    this.state = {
      openActive: false,
      open: false,
      selected: 0,
      shadowTop: 0,
      expand: false
    }
  }

  componentDidMount () {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
  }

  componentWillUnmount () {
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }

  getBalances (chainId, defaultSymbol, rawBalances, rates, chainLayer) {
    const mainBalance = rawBalances[defaultSymbol]
    const tokenBalances = Object.values(rawBalances)
      .filter(b => Number(b.chainId) === Number(chainId) && b.symbol !== defaultSymbol)

    const balances = [mainBalance].concat(tokenBalances)
      .filter(Boolean)
      .map(rawBalance => {
        const rate = rates[rawBalance.address || rawBalance.symbol] || {}

        return balance(rawBalance, chainLayer === 'testnet' ? 0 : rate.usd)
      })
      .sort((a, b) => {
        return b.totalValue.minus(a.totalValue).toNumber()
      })

    const nativeCurrency = this.store('main.networksMeta.ethereum', chainId, 'nativeCurrency')

    if (nativeCurrency) {
      const rawNativeCurrency = {
        balance: this.store('main.balances', chainId, this.store('selected.current'), 'native.balance'), 
        chainId,
        decimals: 18,
        logoURI: nativeCurrency.icon,
        name: nativeCurrency.name,
        symbol: this.store('main.networks.ethereum', chainId, 'symbol')
      }
      const nativeBalance = balance(rawNativeCurrency, chainLayer === 'testnet' ? { price: 0 } : nativeCurrency.usd)
      balances.unshift(nativeBalance)
    }

    const totalValue = balances.reduce((a, b) => a.plus(b.totalValue), BigNumber(0))

    return { balances, totalDisplayValue: formatUsdRate(totalValue, 0) }
  }


  renderBalance (symbol, balanceInfo, i) {
    const change = parseFloat(balanceInfo.priceChange)
    const direction = change < 0 ? -1 : change > 0 ? 1 : 0
    let priceChangeClass = 'signerBalanceCurrentPriceChange'
    if (direction !== 0) {
      if (direction === 1) {
        priceChangeClass += ' signerBalanceCurrentPriceChangeUp'
      } else {
        priceChangeClass += ' signerBalanceCurrentPriceChangeDown'
      }
    }
    let name = balanceInfo.name
    if (name.length > 20) name = name.substr(0, 20) + '...'
    return (
      <div className={i === 0 ? 'signerBalance signerBalanceBase' : 'signerBalance'} key={symbol} onMouseDown={() => this.setState({ selected: i })}>
        <div className='signerBalanceInner'>
          <div className='signerBalanceLogo'>
            <img 
              src={balanceInfo.logoURI}
              value={symbol.toUpperCase()}
              alt={symbol.toUpperCase()}
            />
          </div>
          <div className='signerBalanceCurrency'>
            {name}
          </div>
          <div className='signerBalancePrice'>
            <span className='signerBalanceCurrentPrice'>{svg.usd(10)}{balanceInfo.price}</span>
            <span className={priceChangeClass}>
              <span>{direction === 1 ? '+' : ''}{balanceInfo.priceChange}%</span>
            </span>
          </div>
          <div className='signerBalanceValue' style={(balanceInfo.displayBalance || '0').length >= 12 ? { fontSize: '15px', top: '10px' } : {}}>
            <span className='signerBalanceSymbol'>{symbol.toUpperCase()}</span>
            {balanceInfo.displayBalance}
          </div>
          <div className='signerBalanceEquivalent'>
            {svg.usd(10)}{balanceInfo.displayValue}
          </div>
        </div>
      </div>
    )
  }

  render () {
    const address = this.store('main.accounts', this.props.id, 'address')
    const { type, id: chainId } = this.store('main.currentNetwork')
    const currentSymbol = this.store('main.networks', type, chainId, 'symbol') || 'ETH'
    const chainLayer = this.store('main.networks', type, chainId, 'layer') || 'testnet'
    const storedBalances = this.store('main.balances', chainId, address) || {}

    const rates = this.store('main.rates')

    let { balances, totalDisplayValue } = this.getBalances(
      chainId,
      currentSymbol.toLowerCase(),
      storedBalances,
      rates,
      chainLayer
    )

    const balancesLength = balances.length

    if (!this.props.expanded) {
      balances = balances.slice(0, 5)
    }

    const fullScan = this.store('main.fullScan', address)

    return (
      <div ref={this.moduleRef} className='balancesBlock'>
        <div className={'moduleHeader moduleHeaderBorderless'}>
          <span>balances</span>
          {this.props.expanded ? (
            <div className='moduleHeaderClose' onMouseDown={() => this.props.expandModule(false)}>
              {svg.close(12)}
            </div>
          ) : null}
          {balancesLength === 0 || !fullScan ? (
            <div className='moduleHeaderLoading'>
              <div className='moduleHeaderLoadingLoader' />
            </div>
          ) : null}
        </div>
        {balances.map(({ symbol, ...balance }, i) => this.renderBalance(symbol, balance, i))}
        <div className='signerBalanceTotal'>
          {balancesLength > 5 && !this.props.expanded ? (
            <div className='signerBalanceShowAll' onMouseDown={() => this.props.expandModule(this.props.moduleId)}>
              <span>More</span>
            </div>
          ) : null}
          <div className='signerBalanceTotalText'>
            <div className='signerBalanceTotalLabel'>
              {'Total: '}
            </div>
            <div className='signerBalanceTotalValue'>
              {svg.usd(11)}{balances.length > 0 && fullScan ? totalDisplayValue : '---.--'}
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default Restore.connect(Balances)
