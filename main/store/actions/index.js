import log from 'electron-log'
import { v5 as uuidv5 } from 'uuid'
import { accountNS, isDefaultAccountName } from '../../../resources/domain/account'
import { toTokenId } from '../../../resources/domain/balance'

const panelActions = require('../../../resources/store/actions.panel')
const supportedNetworkTypes = ['ethereum']

function switchChainForOrigins(origins, oldChainId, newChainId) {
  Object.entries(origins).forEach(([origin, { chain }]) => {
    if (oldChainId === chain.id) {
      origins[origin].chain = { id: newChainId, type: 'ethereum' }
    }
  })
}

function validateNetworkSettings(network) {
  const networkId = parseInt(network.id)

  if (
    !Number.isInteger(networkId) ||
    typeof network.type !== 'string' ||
    typeof network.name !== 'string' ||
    typeof network.explorer !== 'string' ||
    typeof network.symbol !== 'string' ||
    !supportedNetworkTypes.includes(network.type)
  ) {
    throw new Error(`Invalid network settings: ${JSON.stringify(network)}`)
  }

  return networkId
}

function includesToken(tokens, token) {
  const existingAddress = token.address.toLowerCase()
  return tokens.some((t) => t.address.toLowerCase() === existingAddress && t.chainId === token.chainId)
}

module.exports = {
  ...panelActions,
  // setSync: (u, key, payload) => u(key, () => payload),
  activateNetwork: (u, type, chainId, active) => {
    u('main.networks', type, chainId, 'on', () => active)

    if (!active) {
      u('main', (main) => {
        // If de-activating a network that an origin is currently using, switch them to mainnet
        switchChainForOrigins(main.origins, chainId, 1)

        return main
      })
    }
  },
  selectPrimary: (u, netType, netId, value) => {
    u('main.networks', netType, netId, 'connection.primary.current', () => value)
  },
  selectSecondary: (u, netType, netId, value) => {
    u('main.networks', netType, netId, 'connection.secondary.current', () => value)
  },
  setPrimaryCustom: (u, netType, netId, target) => {
    if (!netType || !netId) return
    u('main.networks', netType, netId, 'connection.primary.custom', () => target)
  },
  setSecondaryCustom: (u, netType, netId, target) => {
    if (!netType || !netId) return
    u('main.networks', netType, netId, 'connection.secondary.custom', () => target)
  },
  toggleConnection: (u, netType, netId, node, on) => {
    u('main.networks', netType, netId, 'connection', node, 'on', (value) => {
      return on !== undefined ? on : !value
    })
  },
  setPrimary: (u, netType, netId, status) => {
    u('main.networks', netType, netId, 'connection.primary', (primary) => {
      return Object.assign({}, primary, status)
    })
  },
  setSecondary: (u, netType, netId, status) => {
    u('main.networks', netType, netId, 'connection.secondary', (secondary) => {
      return Object.assign({}, secondary, status)
    })
  },
  setLaunch: (u, launch) => u('main.launch', (_) => launch),
  toggleLaunch: (u) => u('main.launch', (launch) => !launch),
  toggleReveal: (u) => u('main.reveal', (reveal) => !reveal),
  toggleNonceAdjust: (u) => u('main.nonceAdjust', (nonceAdjust) => !nonceAdjust),
  toggleShowLocalNameWithENS: (u) =>
    u('main.showLocalNameWithENS', (showLocalNameWithENS) => !showLocalNameWithENS),
  setPermission: (u, address, permission) => {
    u('main.permissions', address, (permissions = {}) => {
      permissions[permission.handlerId] = permission
      return permissions
    })
  },
  clearPermissions: (u, address) => {
    u('main.permissions', address, () => {
      return {}
    })
  },
  toggleAccess: (u, address, handlerId) => {
    u('main.permissions', address, (permissions) => {
      permissions[handlerId].provider = !permissions[handlerId].provider
      return permissions
    })
  },
  setAccountCloseLock: (u, value) => {
    u('main.accountCloseLock', () => Boolean(value))
  },
  syncPath: (u, path, value) => {
    if (!path || path === '*' || path.startsWith('main')) return // Don't allow updates to main state
    u(path, () => value)
  },
  dontRemind: (u, version) => {
    u('main.updater.dontRemind', (dontRemind) => {
      if (!dontRemind.includes(version)) {
        return [...dontRemind, version]
      }

      return dontRemind
    })
  },
  setAccount: (u, account) => {
    u('selected.current', (_) => account.id)
    u('selected.minimized', (_) => false)
    u('selected.open', (_) => true)
  },
  setAccountSignerStatusOpen: (u, value) => {
    u('selected.signerStatusOpen', () => Boolean(value))
  },
  accountTokensUpdated: (u, address) => {
    u('main.accounts', address, (account) => {
      const balances = { ...account.balances, lastUpdated: new Date().getTime() }
      const updated = { ...account, balances }

      return updated
    })
  },
  updateAccount: (u, updatedAccount) => {
    const { id, name } = updatedAccount
    u('main.accounts', id, (account = {}) => {
      return { ...updatedAccount, balances: account.balances || {} }
    })
    if (name && !isDefaultAccountName({ ...updatedAccount, name })) {
      const accountMetaId = uuidv5(id, accountNS)
      u('main.accountsMeta', accountMetaId, (accountMeta) => {
        return { ...accountMeta, name, lastUpdated: Date.now() }
      })
    }
  },
  removeAccount: (u, id) => {
    u('main.accounts', (accounts) => {
      delete accounts[id]
      return accounts
    })
  },
  removeSigner: (u, id) => {
    u('main.signers', (signers) => {
      delete signers[id]
      return signers
    })
  },
  updateSigner: (u, signer) => {
    if (!signer.id) return
    u('main.signers', signer.id, (prev) => ({ ...prev, ...signer }))
  },
  newSigner: (u, signer) => {
    u('main.signers', (signers) => {
      signers[signer.id] = { ...signer, createdAt: new Date().getTime() }
      return signers
    })
  },
  setLatticeConfig: (u, id, key, value) => {
    u('main.lattice', id, key, () => value)
  },
  updateLattice: (u, deviceId, update) => {
    if (deviceId && update) u('main.lattice', deviceId, (current = {}) => Object.assign(current, update))
  },
  removeLattice: (u, deviceId) => {
    if (deviceId) {
      u('main.lattice', (lattice = {}) => {
        delete lattice[deviceId]
        return lattice
      })
    }
  },
  setLatticeAccountLimit: (u, limit) => {
    u('main.latticeSettings.accountLimit', () => limit)
  },
  setLatticeEndpointMode: (u, mode) => {
    u('main.latticeSettings.endpointMode', () => mode)
  },
  setLatticeEndpointCustom: (u, url) => {
    u('main.latticeSettings.endpointCustom', () => url)
  },
  setLatticeDerivation: (u, value) => {
    u('main.latticeSettings.derivation', () => value)
  },
  setLedgerDerivation: (u, value) => {
    u('main.ledger.derivation', () => value)
  },
  setTrezorDerivation: (u, value) => {
    u('main.trezor.derivation', () => value)
  },
  setLiveAccountLimit: (u, value) => {
    u('main.ledger.liveAccountLimit', () => value)
  },
  setHardwareDerivation: (u, value) => {
    u('main.hardwareDerivation', () => value)
  },
  setMenubarGasPrice: (u, value) => {
    u('main.menubarGasPrice', () => value)
  },
  muteAlphaWarning: (u) => {
    u('main.mute.alphaWarning', () => true)
  },
  muteWelcomeWarning: (u) => {
    u('main.mute.welcomeWarning', () => true)
  },
  toggleExplorerWarning: (u) => {
    u('main.mute.explorerWarning', (v) => !v)
  },
  toggleGasFeeWarning: (u) => {
    u('main.mute.gasFeeWarning', (v) => !v)
  },
  toggleSignerCompatibilityWarning: (u) => {
    u('main.mute.signerCompatibilityWarning', (v) => !v)
  },
  setAltSpace: (u, v) => {
    u('main.shortcuts.altSlash', () => v)
  },
  setAutohide: (u, v) => {
    u('main.autohide', () => v)
  },
  setErrorReporting: (u, enable) => {
    u('main.privacy.errorReporting', () => enable)
  },
  setGasFees: (u, netType, netId, fees) => {
    u('main.networksMeta', netType, netId, 'gas.price.fees', () => fees)
  },
  setGasPrices: (u, netType, netId, prices) => {
    u('main.networksMeta', netType, netId, 'gas.price.levels', () => prices)
  },
  setGasDefault: (u, netType, netId, level, price) => {
    u('main.networksMeta', netType, netId, 'gas.price.selected', () => level)
    if (level === 'custom') {
      u('main.networksMeta', netType, netId, 'gas.price.levels.custom', () => price)
    } else {
      u('main.networksMeta', netType, netId, 'gas.price.lastLevel', () => level)
    }
  },
  setNativeCurrencyData: (u, netType, netId, currency) => {
    u('main.networksMeta', netType, netId, 'nativeCurrency', (existing) => ({ ...existing, ...currency }))
  },
  addNetwork: (u, net) => {
    try {
      net.id = validateNetworkSettings(net)

      const primaryRpc = net.primaryRpc || ''
      const secondaryRpc = net.secondaryRpc || ''
      delete net.primaryRpc
      delete net.secondaryRpc

      const defaultNetwork = {
        id: 0,
        type: '',
        name: '',
        explorer: '',
        gas: {
          price: {
            selected: 'standard',
            levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
          }
        },
        connection: {
          presets: { local: 'direct' },
          primary: {
            on: true,
            current: 'custom',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: primaryRpc
          },
          secondary: {
            on: false,
            current: 'custom',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: secondaryRpc
          }
        },
        on: true
      }

      const defaultMeta = {
        blockHeight: 0,
        name: net.name,
        primaryColor: net.primaryColor,
        nativeCurrency: {
          symbol: net.symbol,
          icon: '',
          name: '',
          decimals: 18
        },
        gas: {
          price: {
            selected: 'standard',
            levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
          }
        }
      }

      u('main', (main) => {
        if (!main.networks[net.type]) main.networks[net.type] = {}
        if (main.networks[net.type][net.id]) return main // Network already exists, don't overwrite, notify user

        main.networks[net.type][net.id] = { ...defaultNetwork, ...net }
        main.networksMeta[net.type][net.id] = { ...defaultMeta }

        return main
      })
    } catch (e) {
      log.error(e)
    }
  },
  updateNetwork: (u, net, newNet) => {
    try {
      net.id = validateNetworkSettings(net)
      newNet.id = validateNetworkSettings(newNet)

      u('main', (main) => {
        const updatedNetwork = Object.assign({}, main.networks[net.type][net.id], newNet)

        Object.keys(updatedNetwork).forEach((k) => {
          if (typeof updatedNetwork[k] === 'string') {
            updatedNetwork[k] = updatedNetwork[k].trim()
          }
        })

        delete main.networks[net.type][net.id]
        main.networks[updatedNetwork.type][updatedNetwork.id] = updatedNetwork

        Object.entries(main.origins).forEach(([origin, { chain }]) => {
          if (net.id === chain.id) {
            main.origins[origin].chain = updatedNetwork
          }
        })

        main.networksMeta[updatedNetwork.type][updatedNetwork.id] =
          main.networksMeta[updatedNetwork.type][updatedNetwork.id] || {}
        main.networksMeta[updatedNetwork.type][updatedNetwork.id].symbol = newNet.symbol

        main.networksMeta[updatedNetwork.type][updatedNetwork.id].nativeCurrency =
          main.networksMeta[updatedNetwork.type][updatedNetwork.id].nativeCurrency || {}
        main.networksMeta[updatedNetwork.type][updatedNetwork.id].nativeCurrency.symbol = newNet.symbol

        return main
      })
    } catch (e) {
      log.error(e)
    }
  },
  removeNetwork: (u, net) => {
    try {
      net.id = parseInt(net.id)

      // Cannot delete mainnet
      if (!Number.isInteger(net.id)) throw new Error('Invalid chain id')
      if (net.type === 'ethereum' && net.id === 1) throw new Error('Cannot remove mainnet')
      u('main', (main) => {
        if (Object.keys(main.networks[net.type]).length <= 1) {
          return main // Cannot delete last network without adding a new network of this type first
        }

        // If deleting a network that an origin is currently using, switch them to mainnet
        switchChainForOrigins(main.origins, net.id, 1)

        if (main.networks[net.type]) {
          delete main.networks[net.type][net.id]
          delete main.networksMeta[net.type][net.id]
        }

        return main
      })
    } catch (e) {
      log.error(e)
    }
  },
  // Flow
  addDapp: (u, namehash, data, options = { docked: false, added: false }) => {
    u(`main.dapp.details.${namehash}`, () => data)
    u('main.dapp.map', (map) => {
      if (options.docked && map.docked.length <= 10) {
        map.docked.push(namehash)
      } else {
        map.added.unshift(namehash)
      }
      return map
    })
  },
  setDappOpen: (u, ens, open) => {
    u('main.openDapps', (dapps) => {
      if (open) {
        if (dapps.indexOf(ens) === -1) dapps.push(ens)
      } else {
        dapps = dapps.filter((e) => e !== ens)
      }
      return dapps
    })
  },
  removeDapp: (u, namehash) => {
    u('main.dapp.details', (dapps) => {
      dapps = { ...dapps }
      delete dapps[namehash]
      return dapps
    })
    u('main.dapp.map', (map) => {
      let index = map.added.indexOf(namehash)
      if (index !== -1) {
        map.added.splice(index, 1)
      } else {
        index = map.docked.indexOf(namehash)
        if (index !== -1) map.docked.splice(index, 1)
      }
      return map
    })
  },
  moveDapp: (u, fromArea, fromIndex, toArea, toIndex) => {
    u('main.dapp.map', (map) => {
      const hash = map[fromArea][fromIndex]
      map[fromArea].splice(fromIndex, 1)
      map[toArea].splice(toIndex, 0, hash)
      return map
    })
  },
  setDappStorage: (u, hash, state) => {
    if (state) u(`main.dapp.storage.${hash}`, () => state)
  },
  initOrigin: (u, originId, origin) => {
    u('main.origins', (origins) => {
      const now = new Date().getTime()

      const createdOrigin = {
        ...origin,
        session: {
          requests: 1,
          startedAt: now,
          lastUpdatedAt: now
        }
      }

      return { ...origins, [originId]: createdOrigin }
    })
  },
  addOriginRequest: (u, originId) => {
    const now = new Date().getTime()

    u('main.origins', originId, (origin) => {
      // start a new session if the previous one has already ended
      const isNewSession = origin.session.startedAt < origin.session.endedAt
      const startedAt = isNewSession ? now : origin.session.startedAt
      const requests = isNewSession ? 1 : origin.session.requests + 1

      return {
        ...origin,
        session: {
          requests,
          startedAt,
          endedAt: undefined,
          lastUpdatedAt: now
        }
      }
    })
  },
  endOriginSession: (u, originId) => {
    u('main.origins', (origins) => {
      const origin = origins[originId]
      if (origin) {
        const now = new Date().getTime()
        const session = Object.assign({}, origin.session, { endedAt: now, lastUpdatedAt: now })
        origins[originId] = Object.assign({}, origin, { session })
      }
      return origins
    })
  },
  switchOriginChain: (u, originId, chainId, type) => {
    if (originId && typeof chainId === 'number' && type === 'ethereum') {
      u('main.origins', originId, (origin) => ({ ...origin, chain: { id: chainId, type } }))
    }
  },
  clearOrigins: (u) => {
    u('main.origins', () => ({}))
  },
  removeOrigin: (u, originId) => {
    u('windows.dash.nav', () => []) // Reset nav
    u('main.origins', (origins) => {
      delete origins[originId]
      return origins
    })
  },
  trustExtension: (u, extensionId, trusted) => {
    u('main.knownExtensions', (extensions = {}) => ({ ...extensions, [extensionId]: trusted }))
  },
  setBlockHeight: (u, chainId, blockHeight) => {
    u('main.networksMeta.ethereum', (chainsMeta) => {
      if (chainsMeta[chainId]) {
        chainsMeta[chainId] = { ...chainsMeta[chainId], blockHeight }
      } else {
        log.error(`Action Error: setBlockHeight chainId: ${chainId} not found in chainsMeta`)
      }
      return chainsMeta
    })
  },
  setChainColor: (u, chainId, color) => {
    u('main.networksMeta.ethereum', (chainsMeta) => {
      if (chainsMeta[chainId]) {
        chainsMeta[chainId] = { ...chainsMeta[chainId], primaryColor: color }
      } else {
        log.error(`Action Error: setChainColor chainId: ${chainId} not found in chainsMeta`)
      }
      return chainsMeta
    })
  },
  expandDock: (u, expand) => {
    u('dock.expand', (s) => expand)
  },
  pin: (u) => {
    u('main.pin', (pin) => !pin)
  },
  saveAccount: (u, id) => {
    u('main.save.account', () => id)
  },
  setIPFS: (u, ipfs) => {
    u('main.ipfs', () => ipfs)
  },
  setRates: (u, rates) => {
    u('main.rates', (existingRates = {}) => ({ ...existingRates, ...rates }))
  },
  // Inventory
  setInventory: (u, address, inventory) => {
    u('main.inventory', address, () => inventory)
  },
  setBalance: (u, address, balance) => {
    u('main.balances', address, (balances = []) => {
      const existingBalances = balances.filter(
        (b) => b.address !== balance.address || b.chainId !== balance.chainId
      )

      return [...existingBalances, balance]
    })
  },
  // Tokens
  setBalances: (u, address, newBalances) => {
    u('main.balances', address, (balances = []) => {
      const existingBalances = balances.filter((b) => {
        return newBalances.every((bal) => bal.chainId !== b.chainId || bal.address !== b.address)
      })

      // TODO: possibly add an option to filter out zero balances
      //const withoutZeroBalances = Object.entries(updatedBalances)
      //.filter(([address, balanceObj]) => !(new BigNumber(balanceObj.balance)).isZero())
      return [...existingBalances, ...newBalances]
    })
  },
  removeBalance: (u, chainId, address) => {
    u('main.balances', (balances = {}) => {
      const key = address.toLowerCase()

      for (const accountAddress in balances) {
        const balanceIndex = balances[accountAddress].findIndex(
          (balance) => balance.chainId === chainId && balance.address.toLowerCase() === key
        )

        if (balanceIndex > -1) {
          balances[accountAddress].splice(balanceIndex, 1)
        }
      }

      return balances
    })
  },
  removeBalances: (u, address, tokensToRemove) => {
    const needsRemoval = (balance) => tokensToRemove.has(toTokenId(balance))
    u('main.balances', address, (balances = []) => balances.filter((balance) => !needsRemoval(balance)))
  },
  setScanning: (u, address, scanning) => {
    if (scanning) {
      u('main.scanning', address, () => true)
    } else {
      setTimeout(() => {
        u('main.scanning', address, () => false)
      }, 1000)
    }
  },
  omitToken: (u, address, omitToken) => {
    u('main.accounts', address, 'tokens.omit', (omit) => {
      omit = omit || []
      if (omit.indexOf(omitToken) === -1) omit.push(omitToken)
      return omit
    })
  },
  addCustomTokens: (u, tokens) => {
    u('main.tokens.custom', (existing) => {
      // remove any tokens that have been overwritten by one with
      // the same address and chain ID
      const existingTokens = existing.filter((token) => !includesToken(tokens, token))
      const tokensToAdd = tokens.map((t) => ({ ...t, address: t.address.toLowerCase() }))

      return [...existingTokens, ...tokensToAdd]
    })
  },
  removeCustomTokens: (u, tokens) => {
    u('main.tokens.custom', (existing) => {
      return existing.filter((token) => !includesToken(tokens, token))
    })
  },
  addKnownTokens: (u, address, tokens) => {
    u('main.tokens.known', address, (existing = []) => {
      const existingTokens = existing.filter((token) => !includesToken(tokens, token))
      const tokensToAdd = tokens.map((t) => ({ ...t, address: t.address.toLowerCase() }))

      return [...existingTokens, ...tokensToAdd]
    })
  },
  removeKnownTokens: (u, address, tokensToRemove) => {
    const needsRemoval = (token) => tokensToRemove.has(toTokenId(token))
    u('main.tokens.known', address, (existing = []) => existing.filter((token) => !needsRemoval(token)))
  },
  setColorway: (u, colorway) => {
    u('main.colorway', () => {
      return colorway
    })
  },
  // Dashboard
  toggleDash: (u, force) => {
    u('windows.dash.showing', (s) => (force === 'hide' ? false : force === 'show' ? true : !s))
  },
  closeDash: (u) => {
    u('windows.dash.showing', () => false)
    u('windows.dash.nav', () => []) // Reset nav
  },
  setDash: (u, update) => {
    if (!update.showing) {
      u('windows.dash.nav', () => []) // Reset nav
    }
    u('windows.dash', (dash) => Object.assign(dash, update))
  },
  navForward: (u, windowId, crumb) => {
    if (!windowId || !crumb) return log.warn('Invalid nav forward', windowId, crumb)
    u('windows', windowId, 'nav', (nav) => {
      if (JSON.stringify(nav[0]) !== JSON.stringify(crumb)) nav.unshift(crumb)
      return nav
    })
    u('windows', windowId, 'showing', () => true)
  },
  navUpdate: (u, windowId, crumb, navigate) => {
    if (!windowId || !crumb) return log.warn('Invalid nav forward', windowId, crumb)
    u('windows', windowId, 'nav', (nav) => {
      const updatedNav = {
        view: nav[0].view || crumb.view,
        data: Object.assign({}, nav[0].data, crumb.data)
      }
      if (JSON.stringify(nav[0]) !== JSON.stringify(updatedNav)) {
        if (navigate) {
          nav.unshift(updatedNav)
        } else {
          nav[0] = updatedNav
        }
      }
      return nav
    })
    if (navigate) u('windows', windowId, 'showing', () => true)
  },
  navReplace: (u, windowId, crumbs = []) => {
    u('windows', windowId, (win) => {
      win.nav = crumbs
      win.showing = true
      return win
    })
  },
  navClearReq: (u, handlerId, showRequestInbox = true) => {
    u('windows.panel.nav', (nav) => {
      const newNav = nav.filter((navItem) => {
        // remove the filtered request
        const isClearedRequest = navItem?.data?.requestId === handlerId

        // remove the request inbox from the nav if not requested
        const isRequestInbox = navItem?.data?.id === 'requests' && navItem?.view === 'expandedModule'

        return !isClearedRequest && (showRequestInbox || !isRequestInbox)
      })

      return newNav
    })
  },
  navBack: (u, windowId, numSteps = 1) => {
    if (!windowId) return log.warn('Invalid nav back', windowId)
    u('windows', windowId, 'nav', (nav) => {
      while (numSteps > 0 && nav.length > 0) {
        nav.shift()
        numSteps -= 1
      }
      return nav
    })
  },
  navDash: (u, navItem) => {
    u('windows.dash.nav', (nav) => {
      if (JSON.stringify(nav[0]) !== JSON.stringify(navItem)) nav.unshift(navItem)
      return nav
    })
    u('windows.dash.showing', () => true)
  },
  backDash: (u, numSteps = 1) => {
    u('windows.dash.nav', (nav) => {
      while (numSteps > 0 && nav.length > 0) {
        nav.shift()
        numSteps -= 1
      }
      return nav
    })
  },
  muteBetaDisclosure: (u) => {
    u('main.mute.betaDisclosure', () => true)
    const navItem = { view: 'accounts', data: {} }
    u('windows.dash.nav', (nav) => {
      if (JSON.stringify(nav[0]) !== JSON.stringify(navItem)) nav.unshift(navItem)
      return nav
    })
    u('windows.dash.showing', () => true)
  },
  completeOnboarding: (u) => {
    u('main.mute.onboardingWindow', () => true)
  },
  // Dapp Frame
  appDapp: (u, dapp) => {
    u('main.dapps', (dapps) => {
      if (dapps && !dapps[dapp.id]) {
        dapps[dapp.id] = dapp
      }
      return dapps || {}
    })
  },
  updateDapp: (u, dappId, update) => {
    u('main.dapps', (dapps) => {
      if (dapps && dapps[dappId]) {
        dapps[dappId] = Object.assign({}, dapps[dappId], update)
      }
      return dapps || {}
    })
  },
  addFrame: (u, frame) => {
    u('main.frames', frame.id, () => frame)
  },
  updateFrame: (u, frameId, update) => {
    u('main.frames', frameId, (frame) => Object.assign({}, frame, update))
  },
  removeFrame: (u, frameId) => {
    u('main.frames', (frames) => {
      delete frames[frameId]
      return frames
    })
  },
  focusFrame: (u, frameId) => {
    u('main.focusedFrame', () => frameId)
  },
  addFrameView: (u, frameId, view) => {
    if (frameId && view) {
      u('main.frames', frameId, (frame) => {
        let existing
        Object.keys(frame.views).some((viewId) => {
          if (frame.views[viewId].dappId === view.dappId) {
            existing = viewId
            return true
          } else {
            return false
          }
        })
        if (!existing) {
          frame.views = frame.views || {}
          frame.views[view.id] = view
          frame.currentView = view.id
        } else {
          frame.currentView = existing
        }
        return frame
      })
    }
  },
  setCurrentFrameView: (u, frameId, viewId) => {
    if (frameId) {
      u('main.frames', frameId, (frame) => {
        frame.currentView = viewId
        return frame
      })
    }
  },
  updateFrameView: (u, frameId, viewId, update) => {
    u('main.frames', frameId, 'views', (views) => {
      if ((update.show && views[viewId].ready) || (update.ready && views[viewId].show)) {
        Object.keys(views).forEach((id) => {
          if (id !== viewId) views[id].show = false
        })
      }
      views[viewId] = Object.assign({}, views[viewId], update)
      return views
    })
  },
  removeFrameView: (u, frameId, viewId) => {
    u('main.frames', frameId, 'views', (views) => {
      delete views[viewId]
      return views
    })
  },
  unsetAccount: (u) => {
    u('selected.open', (_) => false)
    u('selected.minimized', (_) => true)
    u('selected.view', (_) => 'default')
    u('selected.showAccounts', (_) => false)
    u('windows.panel.nav', () => [])
    setTimeout((_) => {
      u('selected', (signer) => {
        signer.last = signer.current
        signer.current = ''
        signer.requests = {}
        signer.view = 'default'
        return signer
      })
    }, 320)
  },
  setAccountFilter: (u, value) => {
    u('panel.accountFilter', () => value)
  },
  setFooterHeight: (u, win, height) => {
    u('windows', win, 'footer.height', () => (height < 40 ? 40 : height))
  }
  // toggleUSDValue: (u) => {
  //   u('main.showUSDValue', show => !show)
  // }
  // __overwrite: (path, value) => u(path, () => value)
}
