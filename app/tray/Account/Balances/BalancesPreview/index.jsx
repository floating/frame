import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import link from '../../../../../resources/link'
import svg from '../../../../../resources/svg'
import { isNetworkConnected } from '../../../../../resources/utils/chains'
import {
  formatUsdRate,
  createBalance,
  sortByTotalValue as byTotalValue,
  isNativeCurrency
} from '../../../../../resources/domain/balance'
import { matchFilter } from '../../../../../resources/utils'

import { Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

import Balance from '../Balance'

class BalancesPreview extends React.Component {
  constructor(...args) {
    super(...args)
    this.moduleRef = React.createRef()
    if (!this.props.expanded) {
      this.resizeObserver = new ResizeObserver(() => {
        clearTimeout(this.resizeTimer)
        this.resizeTimer = setTimeout(() => {
          if (this.moduleRef && this.moduleRef.current) {
            link.send('tray:action', 'updateAccountModule', this.props.moduleId, {
              height: this.moduleRef.current.clientHeight
            })
          }
        }, 100)
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

  componentDidMount() {
    if (this.resizeObserver) this.resizeObserver.observe(this.moduleRef.current)
  }

  componentWillUnmount() {
    if (this.resizeObserver) this.resizeObserver.disconnect()
  }

  getBalances(rawBalances, rates) {
    const networks = this.store('main.networks.ethereum')
    const networksMeta = this.store('main.networksMeta.ethereum')

    return (
      rawBalances
        // only show balances from connected networks
        .filter((rawBalance) => isNetworkConnected(networks[rawBalance.chainId]))
        .map((rawBalance) => {
          const isNative = isNativeCurrency(rawBalance.address)
          const nativeCurrencyInfo = networksMeta[rawBalance.chainId].nativeCurrency || {}

          const rate = isNative ? nativeCurrencyInfo : rates[rawBalance.address || rawBalance.symbol] || {}
          const logoURI = (isNative && nativeCurrencyInfo.icon) || rawBalance.logoURI
          const name = isNative
            ? nativeCurrencyInfo.name || networks[rawBalance.chainId].name
            : rawBalance.name
          const decimals = isNative ? nativeCurrencyInfo.decimals || 18 : rawBalance.decimals
          const symbol = (isNative && nativeCurrencyInfo.symbol) || rawBalance.symbol

          return createBalance(
            { ...rawBalance, logoURI, name, decimals, symbol },
            networks[rawBalance.chainId].isTestnet ? { price: 0 } : rate.usd
          )
        })
        .sort(byTotalValue)
    )
  }

  render() {
    const { address, lastSignerType } = this.store('main.accounts', this.props.account)
    const storedBalances = this.store('main.balances', address) || []
    const rates = this.store('main.rates')

    const allBalances = this.getBalances(storedBalances, rates)

    // if filter only show balances that match filter
    const filteredBalances = allBalances.filter((balance) => {
      const { filter = '' } = this.props
      const chainName = this.store('main.networks.ethereum', balance.chainId, 'name')
      return matchFilter(filter, [chainName, balance.name, balance.symbol])
    })

    const totalValue = filteredBalances.reduce((a, b) => a.plus(b.totalValue), BigNumber(0))
    const totalDisplayValue = formatUsdRate(totalValue, 0)
    const lastBalanceUpdate = this.store('main.accounts', address, 'balances.lastUpdated')

    const balances = filteredBalances.slice(0, 4)

    // scan if balances are more than a minute old
    const scanning = !lastBalanceUpdate || new Date() - new Date(lastBalanceUpdate) > 1000 * 60
    const hotSigner = ['ring', 'seed'].includes(lastSignerType)

    return (
      <div ref={this.moduleRef} className='balancesBlock'>
        <div className={'moduleHeader'}>
          <span>{svg.tokens(13)}</span>
          <span>{'Balances'}</span>
        </div>
        {balances.length && scanning === 0 ? (
          <div className='signerBalancesLoading'>
            <div className='loader' />
          </div>
        ) : null}
        <Cluster>
          {balances.map(({ chainId, symbol, ...balance }, i) => {
            return (
              <ClusterRow key={chainId + symbol}>
                <ClusterValue>
                  <Balance chainId={chainId} symbol={symbol} balance={balance} i={i} scanning={scanning} />
                </ClusterValue>
              </ClusterRow>
            )
          })}
        </Cluster>
        <div className='signerBalanceTotal' style={{ opacity: !scanning ? 1 : 0 }}>
          {!this.props.expanded ? (
            <div className='signerBalanceButtons'>
              <div
                className='signerBalanceButton signerBalanceShowAll'
                onClick={() => {
                  const crumb = {
                    view: 'expandedModule',
                    data: {
                      id: this.props.moduleId,
                      account: this.props.account
                    }
                  }
                  link.send('nav:forward', 'panel', crumb)
                }}
              >
                {filteredBalances.length - balances.length > 0
                  ? `+${filteredBalances.length - balances.length} More`
                  : 'More'}
              </div>
            </div>
          ) : (
            <div className='signerBalanceButtons'>
              <div
                className='signerBalanceButton signerBalanceAddToken'
                onMouseDown={() => {
                  link.send('tray:action', 'navDash', { view: 'tokens', data: { notify: 'addToken' } })
                }}
              >
                <span>Add Token</span>
              </div>
            </div>
          )}
          <div className='signerBalanceTotalText'>
            <div className='signerBalanceTotalLabel'>{'Total'}</div>
            <div className='signerBalanceTotalValue'>
              {svg.usd(11)}
              {balances.length > 0 ? totalDisplayValue : '---.--'}
            </div>
          </div>
        </div>
        {totalValue.toNumber() > 10000 && hotSigner ? (
          <div
            className='signerBalanceWarning'
            onClick={() => this.setState({ showHighHotMessage: !this.state.showHighHotMessage })}
            style={scanning ? { opacity: 0 } : { opacity: 1 }}
          >
            <div className='signerBalanceWarningTitle'>{'high value account is using hot signer'}</div>
            {this.state.showHighHotMessage ? (
              <div className='signerBalanceWarningMessage'>
                {
                  'We recommend using one of our supported hardware signers to increase the security of your account'
                }
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(BalancesPreview)
