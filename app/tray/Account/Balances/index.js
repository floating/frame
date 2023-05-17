import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import BalancesPreview from './BalancesPreview'
import BalancesExpanded from './BalancesExpanded'

import { formatUsdRate } from '../../../../resources/domain/balance'

import { isNetworkConnected } from '../../../../resources/utils/chains'
import { matchFilter } from '../../../../resources/utils'

import {
  createBalance,
  sortByTotalValue as byTotalValue,
  isNativeCurrency
} from '../../../../resources/domain/balance'

class Balances extends React.Component {
  componentDidMount() {
    this.getAllChainsUpdated()
    this.intervalId = setInterval(() => this.getAllChainsUpdated(), 60_000)
  }

  componentWillUnmount() {
    if (this.intervalId) clearInterval(this.intervalId)
  }

  getBalances(filter, hiddenTokens = [], returnHidden = false) {
    const { address } = this.store('main.accounts', this.props.account)
    const rawBalances = this.store('main.balances', address) || []
    const rates = this.store('main.rates')

    const ethereumNetworks = this.store('main.networks.ethereum')
    const networksMeta = this.store('main.networksMeta.ethereum')
    const {
      balances: { populatedChains = {} }
    } = this.store('main.accounts', this.props.account)

    const balances = rawBalances
      // only show balances from connected networks
      .filter((rawBalance) => {
        const chain = ethereumNetworks[rawBalance.chainId]

        const isHidden = hiddenTokens.includes(`${rawBalance.chainId}:${rawBalance.address}`)

        return (
          !!chain &&
          (returnHidden ? isHidden : !isHidden) &&
          isNetworkConnected(ethereumNetworks[rawBalance.chainId]) &&
          populatedChains[rawBalance.chainId] &&
          populatedChains[rawBalance.chainId].expires > Date.now() &&
          matchFilter(filter, [chain.name, rawBalance.name, rawBalance.symbol])
        )
      })
      .map((rawBalance) => {
        const isNative = isNativeCurrency(rawBalance.address)
        const nativeCurrencyInfo = networksMeta[rawBalance.chainId].nativeCurrency || {}

        const rate = isNative ? nativeCurrencyInfo : rates[rawBalance.address || rawBalance.symbol] || {}
        const logoURI = (isNative && nativeCurrencyInfo.icon) || rawBalance.logoURI

        const name = isNative
          ? nativeCurrencyInfo.name || ethereumNetworks[rawBalance.chainId].name
          : rawBalance.name
        const decimals = isNative ? nativeCurrencyInfo.decimals || 18 : rawBalance.decimals
        const symbol = (isNative && nativeCurrencyInfo.symbol) || rawBalance.symbol

        return createBalance(
          { ...rawBalance, logoURI, name, decimals, symbol },
          ethereumNetworks[rawBalance.chainId].isTestnet ? { price: 0 } : rate.usd
        )
      })
      .sort(byTotalValue)

    const totalValue = balances.reduce((a, b) => a.plus(b.totalValue), BigNumber(0))
    const totalDisplayValue = formatUsdRate(totalValue, 0)

    return { balances, totalValue, totalDisplayValue }
  }

  getAllChainsUpdated() {
    const {
      balances: { populatedChains = {} }
    } = this.store('main.accounts', this.props.account)

    const connectedChains = Object.values(this.store('main.networks.ethereum') || {}).reduce((acc, n) => {
      if ((n.connection.primary || {}).connected || (n.connection.secondary || {}).connected) {
        acc.push(n.id)
      }
      return acc
    }, [])

    return connectedChains.every((chainId) => {
      return populatedChains[chainId] && populatedChains[chainId].expires > Date.now()
    })
  }

  isHotSigner() {
    const { lastSignerType } = this.store('main.accounts', this.props.account)
    return ['ring', 'seed'].includes(lastSignerType)
  }

  render() {
    const Component = this.props.expanded ? BalancesExpanded : BalancesPreview
    return (
      <Component
        {...this.props}
        allChainsUpdated={this.getAllChainsUpdated()}
        getBalances={this.getBalances.bind(this)}
        isHotSigner={this.isHotSigner()}
      />
    )
  }
}

export default Restore.connect(Balances)
