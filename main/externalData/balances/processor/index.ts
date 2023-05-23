import log from 'electron-log'

import store from '../../../store'
import surface from '../../surface'
import { BalancesStoreApi } from '..'
import { toTokenId } from '../../../../resources/domain/balance'

import type { Balance, Token } from '../../../store/state'
import type { TokenBalance } from '../scan'

const toExpiryWindow = {
  snapshot: 1000 * 60 * 5,
  scan: 1000 * 60
} as const

const getChangedBalances = (
  address: string,
  tokenBalances: TokenBalance[],
  api: ReturnType<typeof BalancesStoreApi>
) => {
  const currentTokenBalances = api.getTokenBalances(address)
  const custom = api.getCustomTokens()
  const customTokens = new Set(custom.map(toTokenId))
  const isCustomToken = (balance: Balance) => customTokens.has(toTokenId(balance))

  //TODO: in here should we check the token data inside the store and adopt the existing name?
  const changedBalances = tokenBalances.reduce((balances, newBalance) => {
    const currentBalance = currentTokenBalances.find(
      (b) => b.address === newBalance.address && b.chainId === newBalance.chainId
    )

    const isNewBalance = !currentBalance && parseInt(newBalance.balance) !== 0
    const isChangedBalance = !!currentBalance && currentBalance.balance !== newBalance.balance

    //Adopt custom token data if it is a custom token...
    const isCustom = isCustomToken(newBalance)
    if (isCustom)
      newBalance = { ...newBalance, ...custom.find((t) => toTokenId(t) === toTokenId(newBalance)) }

    if (isNewBalance || isChangedBalance || isCustom) {
      balances.push(newBalance)
    }
    return balances
  }, [] as TokenBalance[])

  return changedBalances
}

const getTokenChanges = (
  address: string,
  tokenBalances: TokenBalance[],
  api: ReturnType<typeof BalancesStoreApi>
) => {
  const knownTokens = new Set(api.getKnownTokens(address).map(toTokenId))
  const customTokens = new Set(api.getCustomTokens().map(toTokenId))
  const isKnown = (balance: TokenBalance) => knownTokens.has(toTokenId(balance))

  // add any non-zero balances to the list of known tokens
  const unknownBalances = tokenBalances.filter((b) => parseInt(b.balance) > 0 && !isKnown(b))

  const zeroBalances = tokenBalances.reduce((zeroBalSet, balance) => {
    const tokenId = toTokenId(balance)
    if (parseInt(balance.balance) === 0 && knownTokens.has(tokenId)) {
      zeroBalSet.add(tokenId)
    }
    return zeroBalSet
  }, new Set<string>())

  return { unknownBalances, zeroBalances }
}

const api = BalancesStoreApi(store)

function updateTokens(address: string, zeroBalances: Set<string>, unknownBalances: TokenBalance[]) {
  if (zeroBalances.size) {
    store.removeKnownTokens(address, zeroBalances)
  }

  if (unknownBalances.length) {
    store.addKnownTokens(address, unknownBalances)
  }
}

function handleBalanceUpdate(
  address: string,
  balances: TokenBalance[],
  chains: number[],
  mode: keyof typeof toExpiryWindow
) {
  log.debug('Handling balance update', { address, chains })

  if (mode === 'snapshot') {
    //Include 0 balance custom tokens when its a snapshot update as these will be missing
    const customTokens = api.getCustomTokens()
    const tokenBalanceSet = new Set(balances.map(toTokenId))

    customTokens.forEach((token) => {
      if (!tokenBalanceSet.has(toTokenId(token))) {
        balances.push({
          ...token,
          balance: '0x00',
          displayBalance: '0'
        })
      }
    })
  }

  const changedBalances = getChangedBalances(address, balances, api)
  if (changedBalances.length) {
    store.setBalances(address, changedBalances)
    const { zeroBalances, unknownBalances } = getTokenChanges(address, changedBalances, api)
    updateTokens(address, zeroBalances, unknownBalances)

    store.accountTokensUpdated(address, chains)
  }

  store.addPopulatedChains(address.toLowerCase(), chains, toExpiryWindow[mode])
}

function handleCustomTokenUpdate(customTokens: Token[]) {
  log.debug('Handling custom token update', { customTokens })

  const accounts = api.getAccounts()

  accounts.forEach((address) => {
    const balances = api.getTokenBalances(address)
    const forProcessor = customTokens.filter((token) => surface.networks.has(address, token.chainId))
    const newBalances = forProcessor.reduce((bals, item) => {
      const tokenId = toTokenId(item)

      const existing = balances.find((b) => toTokenId(b) === tokenId)
      const { displayBalance, balance } = existing || { displayBalance: '0', balance: '0x00' }
      return bals.concat({
        ...item,
        displayBalance,
        balance
      })
    }, [] as TokenBalance[])

    if (newBalances.length) {
      store.setBalances(address, newBalances)
    }
  })
}

export default {
  handleBalanceUpdate,
  handleCustomTokenUpdate
}
