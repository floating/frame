import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import BalancesPreview from './BalancesPreview'
import BalancesExpanded from './BalancesExpanded'

import { formatUsdRate } from '../../../../resources/domain/balance'
import { matchFilter } from '../../../../resources/utils'
import {
  createBalance,
  sortByTotalValue as byTotalValue,
  isNativeCurrency
} from '../../../../resources/domain/balance'

const shouldShow = (ethereumNetworks, hiddenTokens, populatedChains, returnHidden) => (rawBalance) => {
  const { chainId, address } = rawBalance
  const isHidden = hiddenTokens.includes(`${chainId}:${address}`)
  const expires = populatedChains[chainId]?.expires > Date.now()

  return ethereumNetworks[chainId] && expires && returnHidden === isHidden
}

const toBalance = (networksMeta, rates, ethereumNetworks) => (rawBalance) => {
  const isNative = isNativeCurrency(rawBalance.address)
  const nativeCurrencyInfo = networksMeta[rawBalance.chainId]?.nativeCurrency || {}
  const chain = ethereumNetworks[rawBalance.chainId]
  const rate = isNative ? nativeCurrencyInfo : rates[rawBalance.address || rawBalance.symbol] || {}

  const logoURI =
    (isNative && nativeCurrencyInfo.icon) || rawBalance.media?.cdn?.thumb || rawBalance.media?.source
  const name = isNative ? nativeCurrencyInfo.name || chain.name : rawBalance.name
  const decimals = isNative ? nativeCurrencyInfo.decimals || 18 : rawBalance.decimals
  const symbol = (isNative && nativeCurrencyInfo.symbol) || rawBalance.symbol

  const balanceData = {
    ...rawBalance,
    logoURI,
    name,
    decimals,
    symbol
  }

  return createBalance(balanceData, chain.isTestnet ? { price: 0 } : rate.usd)
}

class Balances extends React.Component {
  componentDidMount() {
    this.getAllChainsUpdated()
    this.intervalId = setInterval(() => this.getAllChainsUpdated(), 60_000)
  }

  componentWillUnmount() {
    if (this.intervalId) clearInterval(this.intervalId)
  }

  getStoreValues() {
    const { address } = this.store('main.accounts', this.props.account)
    const rawBalances = this.store('main.balances', address) || []
    const rates = this.store('main.rates')

    const ethereumNetworks = this.store('main.networks.ethereum')
    const networksMeta = this.store('main.networksMeta.ethereum')
    const {
      balances: { populatedChains = {} }
    } = this.store('main.accounts', this.props.account)

    return { rawBalances, rates, ethereumNetworks, networksMeta, populatedChains }
  }

  getBalances(filter, hiddenTokens = [], returnHidden = false) {
    const { rawBalances, rates, ethereumNetworks, networksMeta, populatedChains } = this.getStoreValues()

    const filteredBalances = rawBalances.filter(
      shouldShow(ethereumNetworks, hiddenTokens, populatedChains, returnHidden)
    )

    const balances = filteredBalances
      .map(toBalance(networksMeta, rates, ethereumNetworks))
      .filter((rawBalance) => {
        const chain = ethereumNetworks[rawBalance.chainId]
        return matchFilter(filter, [chain.name, rawBalance.name, rawBalance.symbol])
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
