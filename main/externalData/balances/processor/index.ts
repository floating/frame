import { BalancesStoreApi } from '..'
import { TokenBalance } from '../scan'
import { toTokenId } from '../../../../resources/domain/balance'
import store from '../../../store'
import { Balance } from '../../../store/state'
import log from 'electron-log'

const getChangedBalances = (
  address: string,
  tokenBalances: TokenBalance[],
  api: ReturnType<typeof BalancesStoreApi>
) => {
  const currentTokenBalances = api.getTokenBalances(address)
  const customTokens = new Set(api.getCustomTokens().map(toTokenId))
  const isCustomToken = (balance: Balance) => customTokens.has(toTokenId(balance))

  const changedBalances = tokenBalances.filter((newBalance) => {
    const currentBalance = currentTokenBalances.find(
      (b) => b.address === newBalance.address && b.chainId === newBalance.chainId
    )

    // do not add newly found tokens with a zero balance
    const isNewBalance = !currentBalance && parseInt(newBalance.balance) !== 0
    const isChangedBalance = !!currentBalance && currentBalance.balance !== newBalance.balance

    return isNewBalance || isChangedBalance || isCustomToken(newBalance)
  })

  return changedBalances
}

const getTokenChanges = (
  address: string,
  tokenBalances: TokenBalance[],
  api: ReturnType<typeof BalancesStoreApi>
) => {
  const knownTokens = new Set(api.getKnownTokens(address).map(toTokenId))
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

function handleBalanceUpdate(address: string, balances: TokenBalance[], chains: number[], mode: string) {
  log.verbose('handling balance update...', { address, chains })
  const changedBalances = getChangedBalances(address, balances, api)
  if (changedBalances.length) {
    store.setBalances(address, changedBalances)
    const { zeroBalances, unknownBalances } = getTokenChanges(address, changedBalances, api)
    updateTokens(address, zeroBalances, unknownBalances)

    store.accountTokensUpdated(address, chains)
  }

  store.addPopulatedChains(address.toLowerCase(), chains, mode)
}

export default {
  handleBalanceUpdate
}
