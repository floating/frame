import log from 'electron-log'

import { isEqual } from 'lodash'
import surface from '../../surface'
import { storeApi } from '../../storeApi'
import { toTokenId } from '../../../../resources/domain/balance'

import type { Token, TokenBalance } from '../../../store/state'

const toExpiryWindow = {
  snapshot: 1000 * 60 * 5,
  scan: 1000 * 60
} as const

const getChangedBalances = (address: string, tokenBalances: TokenBalance[]): TokenBalance[] => {
  const currentTokenBalances = storeApi.getTokenBalances(address)
  const customTokens = new Set(storeApi.getCustomTokens().map(toTokenId))

  return tokenBalances.reduce((balances, newBalance) => {
    const { address: newAddress, chainId: newChainId, balance: newBalanceValue } = newBalance

    const currentBalance = currentTokenBalances.find(
      ({ address, chainId }) => address === newAddress && chainId === newChainId
    )

    const isCustomToken = customTokens.has(toTokenId(newBalance))

    const hasChanged = isCustomToken
      ? currentBalance?.balance !== newBalanceValue
      : !isEqual(currentBalance, newBalance)

    if (!currentBalance || hasChanged) {
      balances.push(newBalance)
    }

    return balances
  }, [] as TokenBalance[])
}

const getTokenChanges = (address: string, tokenBalances: TokenBalance[]) => {
  const knownTokens = new Set(storeApi.getKnownTokens(address).map(toTokenId))

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

const mergeCustomTokens = (balances: TokenBalance[]): TokenBalance[] => {
  // Retrieve custom tokens from the store
  const custom = storeApi.getCustomTokens()

  // Convert custom tokens array to an object for easier manipulation
  const customData = custom.reduce((data, token) => {
    data[toTokenId(token)] = token
    return data
  }, {} as Record<string, Token>)

  // Merge balances with the custom data
  const mergedBalances = balances.map((balance) => {
    const tokenId = toTokenId(balance)

    if (tokenId in customData) {
      const { name, symbol, decimals } = customData[tokenId]
      balance = { ...balance, name, symbol, decimals }

      // Remove the merged custom token
      delete customData[tokenId]
    }

    return balance
  })

  // Check for any missing custom tokens
  const missingCustomTokens = Object.values(customData)
  if (missingCustomTokens.length) {
    log.debug({ missingCustomTokens })
  }

  // Add missing balances with zero balance
  const missingBalances = missingCustomTokens.map((token) => ({
    ...token,
    balance: '0x00',
    displayBalance: '0'
  }))

  return [...mergedBalances, ...missingBalances]
}

function updateTokens(address: string, zeroBalances: Set<string>, unknownBalances: TokenBalance[]) {
  if (zeroBalances.size) {
    storeApi.removeKnownTokens(address, zeroBalances)
  }

  if (unknownBalances.length) {
    storeApi.addKnownTokens(address, unknownBalances)
  }
}

export function handleBalanceUpdate(
  address: string,
  balances: TokenBalance[],
  chains: number[],
  mode: keyof typeof toExpiryWindow
) {
  log.debug('Handling balance update', { address, chains })

  const withCustom = mergeCustomTokens(balances)

  const changedBalances = getChangedBalances(address, withCustom)

  if (changedBalances.length) {
    storeApi.setBalances(address, changedBalances)
    const { zeroBalances, unknownBalances } = getTokenChanges(address, changedBalances)
    updateTokens(address, zeroBalances, unknownBalances)

    storeApi.setAccountTokensUpdated(address)
  }

  storeApi.addPopulatedChains(address, chains, toExpiryWindow[mode])
}

export function handleCustomTokenUpdate(customTokens: Token[]) {
  log.debug('Handling custom token update', { customTokens })

  const accounts = storeApi.getAccounts()

  accounts.forEach((address) => {
    const balances = storeApi.getTokenBalances(address)
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
      storeApi.setBalances(address, newBalances)
    }
  })
}
