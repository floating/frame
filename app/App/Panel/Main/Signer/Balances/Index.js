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

function formatUsdRate (rate, decimals = 6) {
  return new Intl.NumberFormat('us-US', {
    style: 'currency',
    currency: 'usd',
    maximumFractionDigits: decimals
  }).format(rate)
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

  renderBalance (known, k, i) {
    const token = known[k]

    const tokenBalance = BigNumber(token.balance || 0)
    const displayBalance = formatBalance(tokenBalance)
    const tokenUsdRate = BigNumber(token.usdRate)

    const price = formatUsdRate(tokenUsdRate)
    const totalValue = formatUsdRate(tokenBalance.times(tokenUsdRate))

    return (
      <div className='signerBalance' key={k} onMouseDown={() => this.setState({ selected: i })}>
        <div className='signerBalanceLogo'>
          <img src={token.logoURI} />
        </div>
        <div className='signerBalanceCurrency'>
          {token.symbol}
        </div>
        <div className='signerBalanceName'>
          <span>{token.name + ' -'}</span>
          <span className='signerBalanceCurrentPrice'>{price}</span>
        </div>
        <div className='signerBalanceValue' style={(displayBalance || '0').length >= 12 ? { fontSize: '15px', top: '14px' } : {}}>
          {displayBalance}
        </div>
        <div className='signerBalanceEquivalent'>
          {totalValue}
        </div>
      </div>
    )
  }

  render () {
    const address = this.store('main.accounts', this.props.id, 'address')
    const { type, id } = this.store('main.currentNetwork')

    // TODO: how to set main network symbol
    const currentSymbol = this.store('main.networks', type, id, 'symbol') || 'ETH'

    const balance = this.store('balances', address.toLowerCase())
    const tokens = this.store('main.accounts', address, 'tokens') || {}

    const etherRates = this.store('external.rates')
    const etherUSD = etherRates && etherRates.USD ? parseFloat(etherRates.USD) : 0
    const known = Object.assign({}, tokens.known, {
      default: {
        chainId: 1,
        name: 'Ether',
        decimals: 18,
        address: '0x',
        logoURI: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png?1595348880',
        symbol: currentSymbol,
        balance,
        usdRate: etherUSD
      }
    })
    let knownList = Object.keys(known).sort((a, b) => {
      if (a === 'default') return -1
      if (b === 'default') return 1
      return known[a].usdValue > known[b].usdValue ? -1 : known[a].usdValue < known[b].usdValue ? 1 : 0
    })
    if (!this.state.expand) knownList = knownList.slice(0, 5)

    const totalValue = Object.values(known)
      .map(coin => BigNumber(coin.usdRate).times(BigNumber(coin.balance)))
      .reduce((a, b) => a.plus(b), BigNumber(0))

    const totalDisplayValue = formatUsdRate(totalValue, 2)

    return (
      <div ref={this.moduleRef} className='balancesBlock'>
        <div className='moduleHeader'>account balances</div>
        {knownList.map((k, i) => this.renderBalance(known, k, i))}
        {
          knownList.length <= 1 && this.state.expand
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
