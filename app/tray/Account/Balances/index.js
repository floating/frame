import React from 'react'
import Restore from 'react-restore'
import BigNumber from 'bignumber.js'

import BalancesPreview from './BalancesPreview'
import BalancesExpanded from './BalancesExpanded'

import { formatUsdRate, toTokenId } from '../../../../resources/domain/balance'
import { matchFilter } from '../../../../resources/utils'
import { createBalance, sortByTotalValue, isNativeCurrency } from '../../../../resources/domain/balance'

const shouldShow = (ethereumNetworks, tokenPreferences, populatedChains, returnHidden) => (rawBalance) => {
  const { chainId, address } = rawBalance
  const networkIsEnabled = ethereumNetworks[chainId]?.on
  const preferences = tokenPreferences[`${chainId}:${address}`]
  const isHidden = preferences ? preferences.hidden : rawBalance.hideByDefault || false
  const isExpired = populatedChains[chainId]?.expires > Date.now()

  return networkIsEnabled && isExpired && returnHidden === isHidden
}

const toBalance = (networksMeta, rates, ethereumNetworks) => (rawBalance) => {
  const isNative = isNativeCurrency(rawBalance.address)
  const nativeCurrencyInfo = networksMeta[rawBalance.chainId]?.nativeCurrency || {}
  const chain = ethereumNetworks[rawBalance.chainId]
  const rate = isNative ? nativeCurrencyInfo : rates[toTokenId(rawBalance)] || {}

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

  getBalances(filter, tokenPreferences, returnHidden = false) {
    const { rawBalances, rates, ethereumNetworks, networksMeta, populatedChains } = this.getStoreValues()
    const shouldShowBalance = shouldShow(ethereumNetworks, tokenPreferences, populatedChains, returnHidden)
    const createBalance = toBalance(networksMeta, rates, ethereumNetworks)

    const { filteredBalances, totalValue } = rawBalances.reduce(
      ({ filteredBalances, totalValue }, rawBalance) => {
        const chain = ethereumNetworks[rawBalance.chainId]

        if (
          shouldShowBalance(rawBalance) &&
          matchFilter(filter, [chain.name, rawBalance.name, rawBalance.symbol])
        ) {
          const balance = createBalance(rawBalance)
          filteredBalances.push(balance)
          totalValue = totalValue.plus(BigNumber(balance.totalValue))
        }

        return { filteredBalances, totalValue }
      },
      { filteredBalances: [], totalValue: BigNumber(0) }
    )

    const totalDisplayValue = formatUsdRate(totalValue, 0)

    const balances = filteredBalances
      .sort((a, b) => {
        const aId = `${a.symbol}:${a.address}`
        const bId = `${b.symbol}:${b.address}`
        return aId < bId ? -1 : aId > bId ? 1 : 0
      })
      .sort((a, b) => {
        return a.chainId - b.chainId
      })
      .sort(sortByTotalValue)

    return { balances, totalValue, totalDisplayValue }
  }

  getEnabledChains() {
    const enabledChains = Object.values(this.store('main.networks.ethereum') || {})
      .filter((n) => n.on)
      .map((n) => n.id)

    return enabledChains
  }

  tokenRatesSet(chains) {
    const balances = this.store('main.balances', this.props.account) || []
    const rates = this.store('main.rates')

    const isMissingRate = (balance) =>
      chains.includes(balance.chainId) && !isNativeCurrency(balance.address) && !rates[toTokenId(balance)]

    return !balances.some(isMissingRate)
  }

  balancesSet(chains) {
    const {
      balances: { populatedChains = {} }
    } = this.store('main.accounts', this.props.account)

    const balancesPopulated = (chainId) => populatedChains[chainId]?.expires > Date.now()

    return chains.every(balancesPopulated)
  }

  shouldShowTotalValue() {
    const enabledChains = this.getEnabledChains()
    return this.balancesSet(enabledChains) && this.tokenRatesSet(enabledChains)
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
        shouldShowTotalValue={this.shouldShowTotalValue()}
        getBalances={this.getBalances.bind(this)}
        isHotSigner={this.isHotSigner()}
      />
    )
  }
}

export default Restore.connect(Balances)
