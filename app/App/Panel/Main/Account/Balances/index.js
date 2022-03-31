/* globals ResizeObserver */

import React from 'react'
import Restore from 'react-restore'
import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'

import BigNumber from 'bignumber.js'

const UNKNOWN = '?'
const NATIVE_CURRENCY = '0x0000000000000000000000000000000000000000'

function formatBalance (balance, totalValue, decimals = 8) {
  const isZero = balance.isZero()
  if (!isZero && balance.toNumber() < 0.001 && totalValue.toNumber() < 1) return '<0.001'

  return new Intl.NumberFormat('us-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8
      }).format(balance.toFixed(decimals, BigNumber.ROUND_FLOOR))
}

function formatUsdRate (rate, decimals = 2) {
  return rate.isNaN()
    ? UNKNOWN
    : new Intl.NumberFormat('us-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(rate.toFixed(decimals, BigNumber.ROUND_FLOOR))
}

function balance (rawBalance, quote = {}) {
  const balance = BigNumber(rawBalance.balance || 0).shiftedBy(-rawBalance.decimals)
  const usdRate = BigNumber(quote.price)
  const totalValue = balance.times(usdRate)
  const balanceDecimals = Math.max(2, usdRate.shiftedBy(1).toFixed(0, BigNumber.ROUND_DOWN).length)

  return {
    ...rawBalance,
    displayBalance: formatBalance(balance, totalValue, balanceDecimals),
    price: formatUsdRate(usdRate),
    priceChange: !usdRate.isNaN() && BigNumber(quote['change24hr'] || 0).toFixed(2),
    totalValue: totalValue.isNaN() ? BigNumber(0) : totalValue,
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

  getBalances (chainId, rawBalances, rates, chainLayer) {
    const balances = rawBalances
      .filter(b => b.chainId === chainId && b.address !== NATIVE_CURRENCY) // only tokens
      .map(rawBalance => {
        const rate = rates[rawBalance.address || rawBalance.symbol] || {}

        return balance(rawBalance, chainLayer === 'testnet' ? 0 : rate.usd)
      })
      .sort((a, b) => {
        return b.totalValue.minus(a.totalValue).toNumber()
      })

    const nativeCurrency = this.store('main.networksMeta.ethereum', chainId, 'nativeCurrency')

    if (nativeCurrency) {
      const storedNativeBalance = rawBalances.find(b => {
        return b.chainId === chainId && b.address === NATIVE_CURRENCY
      }) || { balance: '0x0' }

      const symbol = this.store('main.networks.ethereum', chainId, 'symbol')

      const rawNativeCurrency = {
        balance: storedNativeBalance.balance,
        chainId,
        decimals: 18,
        logoURI: nativeCurrency.icon,
        name: nativeCurrency.name || symbol,
        symbol
      }
      const nativeBalance = balance(rawNativeCurrency, chainLayer === 'testnet' ? { price: 0 } : nativeCurrency.usd)
      balances.unshift(nativeBalance)
    }

    const totalValue = balances.reduce((a, b) => a.plus(b.totalValue), BigNumber(0))

    return { balances, totalDisplayValue: formatUsdRate(totalValue, 0), totalValue }
  }

  renderBalance (symbol, balanceInfo, i, scanning) {
    const rawBalance = parseInt(balanceInfo.balance) || 0
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
    if (name.length > 17) name = name.substr(0, 17) + '..'
    return (
      <div className={i === 0 ? 'signerBalance signerBalanceBase' : 'signerBalance'} key={symbol} onMouseDown={() => this.setState({ selected: i })}>
        <div className='signerBalanceInner' style={{ opacity: !scanning || i === 0 || rawBalance > 0 ? 1 : 0, transitionDelay: (0.1 * i) + 's' }}>
          <div className='signerBalanceLogo'>
            <img 
              src={`https://proxy.pylon.link?type=icon&target=${encodeURIComponent(balanceInfo.logoURI)}`}
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
              <span>{direction === 1 ? '+' : ''}{balanceInfo.priceChange ? balanceInfo.priceChange + '%' : ''}</span>
            </span>
          </div>
          <div className='signerBalanceValue' style={(balanceInfo.displayBalance || '0').length >= 12 ? { fontSize: '15px', top: '10px' } : {}}>
            <span className='signerBalanceSymbol'>{symbol.toUpperCase()}</span>
            <span
              style={(balanceInfo.displayBalance || '0').length >= 12 ? { marginTop: '-3px' } : {}}
            >
              {balanceInfo.displayBalance}
            </span>
          </div>
          {<div className='signerBalanceEquivalent'>{svg.usd(10)}{balanceInfo.displayValue}</div>}
        </div>
      </div>
    )
  }

  render () {
    const { address, lastSignerType } = this.store('main.accounts', this.props.id)
    const { type, id: chainId } = this.store('main.currentNetwork')
    const chainLayer = this.store('main.networks', type, chainId, 'layer') || 'testnet'
    const storedBalances = this.store('main.balances', address) || []

    const rates = this.store('main.rates')

    let { balances, totalDisplayValue, totalValue } = this.getBalances(
      chainId,
      storedBalances,
      rates,
      chainLayer
    )

    if (!this.props.expanded) {
      balances = balances.slice(0, 5)
    }

    const lastBalanceUpdate = this.store('main.accounts', address, 'balances.lastUpdated')

    // scan if balances are more than 5 minutes old
    const scanning = !lastBalanceUpdate || (new Date() - lastBalanceUpdate) > (1000 * 60 * 5)

    const hotSigner = ['ring', 'seed'].includes(lastSignerType)

    return (
      <div ref={this.moduleRef} className='balancesBlock'>
        <div className={'moduleHeader moduleHeaderBorderless'}>
          <span>balances</span>
          {this.props.expanded ? (
            <div className='moduleHeaderClose' onMouseDown={() => this.props.expandModule(false)}>
              {svg.close(12)}
            </div>
          ) : null}
        </div>
        {balances.map(({ symbol, ...balance }, i) => this.renderBalance(symbol, balance, i, scanning))}
        <div className='signerBalanceTotal'>
          {!this.props.expanded ? (
            <div className='signerBalanceButtons'>
              <div className='signerBalanceButton signerBalanceShowAll' onMouseDown={() => this.props.expandModule(this.props.moduleId)}>
                More
              </div>
            </div>
          ) : (
            <div className='signerBalanceButtons'>
              <div className='signerBalanceButton signerBalanceAddToken' onMouseDown={() => this.store.notify('addToken')}>
                <span>Add Token</span>
              </div>
            </div>
          )}
          <div className='signerBalanceTotalText'>
            <div className='signerBalanceTotalLabel'>
              {'Total: '}
            </div>
            <div className='signerBalanceTotalValue'>
              {svg.usd(11)}{balances.length > 0 ? totalDisplayValue : '---.--'}
            </div>
          </div>
        </div>
        {totalValue.toNumber() > 10000 && hotSigner ? (
          <div 
            className='signerBalanceWarning'
            onClick={() => this.setState({ showHighHotMessage: !this.state.showHighHotMessage })}
          >
            <div className='signerBalanceWarningTitle'>
              {'high value account is using hot signer'}
            </div>
            {this.state.showHighHotMessage ? <div className='signerBalanceWarningMessage'>
              {'We recommend using one of our supported hardware signers to increase the security of your account'}
            </div> : null}
          </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(Balances)
