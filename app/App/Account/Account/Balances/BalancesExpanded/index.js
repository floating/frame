import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import link from '../../../../../../resources/link'
import svg from '../../../../../../resources/svg'
import { isNetworkConnected } from '../../../../../../resources/utils/chains'
import { NATIVE_CURRENCY } from '../../../../../../resources/constants'

import Balance from '../Balance'
import { formatUsdRate, balance, sortByTotalValue as byTotalValue } from '../../../../../../resources/domain/balance'

function isNativeCurrency (address) {
  return address === NATIVE_CURRENCY
}

class BalancesExpanded extends React.Component {
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

  getBalances (rawBalances, rates) {
    const networks = this.store('main.networks.ethereum')
    const networksMeta = this.store('main.networksMeta.ethereum')

    const balances = rawBalances
      // only show balances from connected networks
      .filter(rawBalance => isNetworkConnected(networks[rawBalance.chainId]))
      .map(rawBalance => {
        const isNative = isNativeCurrency(rawBalance.address)
        const nativeCurrencyInfo = networksMeta[rawBalance.chainId].nativeCurrency || {}

        const rate = isNative ? nativeCurrencyInfo  : rates[rawBalance.address || rawBalance.symbol] || {}
        const logoURI = (isNative && nativeCurrencyInfo.icon) || rawBalance.logoURI
        const name = (isNative && nativeCurrencyInfo.name) || rawBalance.name
        const decimals = isNative ? nativeCurrencyInfo.decimals || 18 : rawBalance.decimals
        const symbol = (isNative && nativeCurrencyInfo.symbol) || rawBalance.symbol

        return balance({ ...rawBalance, logoURI, name, decimals, symbol }, networks[rawBalance.chainId].isTestnet ? { price: 0 } : rate.usd)
      })
      .sort(byTotalValue)

    const totalValue = balances.reduce((a, b) => a.plus(b.totalValue), BigNumber(0))

    return { balances, totalDisplayValue: formatUsdRate(totalValue, 0), totalValue }
  }

  render () {
    const { address, lastSignerType } = this.store('main.accounts', this.props.account)
    const storedBalances = this.store('main.balances', address) || []
    const rates = this.store('main.rates')

    const { balances: allBalances, totalDisplayValue, totalValue } = this.getBalances(storedBalances, rates)
    const balances = allBalances.slice(0, this.props.expanded ? allBalances.length : 4)

    const lastBalanceUpdate = this.store('main.accounts', address, 'balances.lastUpdated')

    // scan if balances are more than a minute old
    const scanning = !lastBalanceUpdate || (new Date() - new Date(lastBalanceUpdate)) > (1000 * 60)
    const hotSigner = ['ring', 'seed'].includes(lastSignerType)

    return (
      <div 
        className='accountViewScroll'
      >
        {scanning ? (
          <div className='signerBalancesLoading'>
            <div className='loader' />
          </div>
        ) : null}
        <div className='signerBalancesWrap'>
          {balances.map(({ chainId, symbol, ...balance }, i) => {
            return <Balance key={chainId + symbol} chainId={chainId} symbol={symbol} balance={balance} i={i} scanning={scanning} />
          })}
        </div>
        <div 
          className='signerBalanceTotal'
          style={{ opacity: !scanning ? 1 : 0 }}
        >
          <div className='signerBalanceButtons'>
            <div className='signerBalanceButton signerBalanceAddToken' onMouseDown={() => {
              link.send('tray:action', 'navDash', { view: 'tokens', data: { notify: 'addToken' }})
            }}>
              <span>Add Token</span>
            </div>
          </div>
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
            style={scanning ? { opacity: 0 } : { opacity: 1 }}
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

export default Restore.connect(BalancesExpanded)
