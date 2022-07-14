import log from 'electron-log'

const panelActions = require('./panel')

function validateNetworkSettings (network) {
  const networkId = parseInt(network.id)

  if (
    (!Number.isInteger(networkId)) ||
    typeof (network.type) !== 'string' ||
    typeof (network.name) !== 'string' ||
    typeof (network.explorer) !== 'string' ||
    typeof (network.symbol) !== 'string' ||
    ['ethereum'].indexOf(network.type) === -1
  ) {
    throw new Error('Invalid network settings ' + JSON.stringify(network))
  }

  return networkId
}

function includesToken (tokens, token) {
  const existingAddress = token.address.toLowerCase()
  return tokens.some(t => 
    t.address.toLowerCase() === existingAddress && t.chainId === token.chainId
  )
}

module.exports = {
  ...panelActions,
  // setSync: (u, key, payload) => u(key, () => payload),
  selectNetwork: (u, type, id) => {
    id = parseInt(id)
    if (!Number.isInteger(id)) return
    const reset = { status: 'loading', connected: false, type: '', network: '' }
    u('main.currentNetwork', selected => {
      u('main.networks', selected.type, selected.id, connection => {
        connection.primary = Object.assign({}, connection.primary, reset)
        connection.secondary = Object.assign({}, connection.secondary, reset)
        return connection
      })
      return { type, id }
    })
  },
  activateNetwork: (u, type, chainId, active) => {
    if (!active) {
      u('main.currentNetwork', (current) => {
        if (current.type === type && current.id === chainId) {
          return { type: 'ethereum', id: 1 }
        } else {
          return current
        }
      })
    }
    u('main.networks', type, chainId, 'on', () => active)
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
    u('main.networks', netType, netId, 'connection.primary', primary => {
      return Object.assign({}, primary, status)
    })
  },
  setSecondary: (u, netType, netId, status) => {
    u('main.networks', netType, netId, 'connection.secondary', secondary => {
      return Object.assign({}, secondary, status)
    })
  },
  setLaunch: (u, launch) => u('main.launch', _ => launch),
  toggleLaunch: u => u('main.launch', launch => !launch),
  toggleReveal: u => u('main.reveal', reveal => !reveal),
  toggleNonceAdjust: u => u('main.nonceAdjust', nonceAdjust => !nonceAdjust),
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
    u('main.permissions', address, permissions => {
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
    u('main.updater.dontRemind', dontRemind => {
      if (!dontRemind.includes(version)) {
        return [...dontRemind, version]
      }

      return dontRemind
    })
  },
  setBlockNumber: (u, network, id, blockNumber) => {
    u('main.networks', network, id, 'blockNumber', () => blockNumber)
  },
  setAccount: (u, account) => {
    u('selected.current', _ => account.id)
    u('selected.minimized', _ => false)
    u('selected.open', _ => true)
  },
  accountTokensUpdated: (u, address) => {
    u('main.accounts', address, account => {
      const balances = { ...account.balances, lastUpdated: new Date().getTime() }
      const updated = { ...account, balances }

      return updated
    })
  },
  updateAccount: (u, updatedAccount) => {
    u('main.accounts', updatedAccount.id, account => {
      // if (account) return updatedAccount // Account exists
      // if (add) return updatedAccount // Account is new and should be added
      return { ...updatedAccount, balances: (account || {}).balances }
    })
  },
  removeAccount: (u, id) => {
    u('main.accounts', accounts => {
      delete accounts[id]
      return accounts
    })
  },
  removeSigner: (u, id) => {
    u('main.signers', signers => {
      delete signers[id]
      return signers
    })
  },
  updateSigner: (u, signer) => {
    if (!signer.id) return
    u('main.signers', signer.id, prev => ({ ...prev, ...signer }))
  },
  newSigner: (u, signer) => {
    u('main.signers', signers => {
      signers[signer.id] = { ...signer, createdAt: new Date().getTime() }
      return signers
    })
  },
  // Ethereum and IPFS clients
  setClientState: (u, client, state) => u(`main.clients.${client}.state`, () => state),
  updateClient: (u, client, key, value) => u(`main.clients.${client}.${key}`, () => value),
  toggleClient: (u, client, on) => u(`main.clients.${client}.on`, (value) => on !== undefined ? on : !value),
  resetClient: (u, client, on) => {
    const data = { on: false, state: 'off', latest: false, installed: false, version: null }
    u(`main.clients.${client}`, () => data)
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
    u('main.mute.explorerWarning', v => !v)
  },
  toggleGasFeeWarning: (u) => {
    u('main.mute.gasFeeWarning', v => !v)
  },
  toggleSignerCompatibilityWarning: (u) => {
    u('main.mute.signerCompatibilityWarning', v => !v)
  },
  setAltSpace: (u, v) => {
    u('main.shortcuts.altSlash', () => v)
  },
  setAutohide: (u, v) => {
    u('main.autohide', () => v)
  },
  setExceptionReporting: (u, v) => {
    u('main.exceptionReporting', () => v)
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
    u('main.networksMeta', netType, netId, 'nativeCurrency', existing => ({ ...existing, ...currency }))
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
        gas: {
          price: {
            selected: 'standard',
            levels: { slow: '', standard: '', fast: '', asap: '', custom: '' }
          }
        }
      }

      u('main', main => {
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
      
      u('main', main => {
        const updatedNetwork = Object.assign({}, main.networks[net.type][net.id], newNet)

        Object.keys(updatedNetwork).forEach(k => {
          if (typeof updatedNetwork[k] === 'string') {
            updatedNetwork[k] = updatedNetwork[k].trim()
          }
        })
        
        delete main.networks[net.type][net.id]
        main.networks[updatedNetwork.type][updatedNetwork.id] = updatedNetwork

        const { type, id } = main.currentNetwork
        if (net.type === type && net.id === id) {
          main.currentNetwork.type = updatedNetwork.type
          main.currentNetwork.id = updatedNetwork.id
        }
        
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
      u('main', main => {
        // If deleting a network that the user is currently on, move them to mainnet
        if (net.type === main.currentNetwork.type && net.id === main.currentNetwork.id) {
          main.currentNetwork.type = 'ethereum'
          main.currentNetwork.id = 1
        }
        let netCount = 0
        Object.keys(main.networks[net.type]).forEach(id => {
          netCount++
        })
        if (netCount <= 1) return main // Cannot delete last network without adding a new network of this type first

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
    u('main.dapp.map', map => {
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
        dapps = dapps.filter(e => e !== ens)
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
    u('main.dapp.map', map => {
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
    u('main.dapp.map', map => {
      const hash = map[fromArea][fromIndex]
      map[fromArea].splice(fromIndex, 1)
      map[toArea].splice(toIndex, 0, hash)
      return map
    })
  },
  setDappStorage: (u, hash, state) => {
    if (state) u(`main.dapp.storage.${hash}`, () => state)
  },
  expandDock: (u, expand) => {
    u('dock.expand', (s) => expand)
  },
  pin: (u) => {
    u('main.pin', pin => !pin)
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
      const existingBalances = balances.filter(b => b.address !== balance.address || b.chainId !== balance.chainId)

      return [...existingBalances, balance]
    })
  },
  // Tokens
  setBalances: (u, address, newBalances) => {
    u('main.balances', address, (balances = []) => {
      const existingBalances = balances.filter(b => {
        return newBalances.every(bal => bal.chainId !== b.chainId || bal.address !== b.address)
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
        const balanceIndex = balances[accountAddress]
          .findIndex(balance => balance.chainId === chainId && balance.address.toLowerCase() === key)

        if (balanceIndex > -1) {
          balances[accountAddress].splice(balanceIndex, 1)
        }
      }

      return balances
    })
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
    u('main.accounts', address, 'tokens.omit', omit => {
      omit = omit || []
      if (omit.indexOf(omitToken) === -1) omit.push(omitToken)
      return omit
    })
  },
  addCustomTokens: (u, tokens) => {
    u('main.tokens.custom', existing => {
      // remove any tokens that have been overwritten by one with
      // the same address and chain ID
      const existingTokens = existing.filter(token => !includesToken(tokens, token))
      const tokensToAdd = tokens.map(t => ({ ...t, address: t.address.toLowerCase() }))

      return [...existingTokens, ...tokensToAdd]
    })
  },
  removeCustomTokens: (u, tokens) => {
    u('main.tokens.custom', existing => {
      return existing.filter(token => !includesToken(tokens, token))
    })
  },
  addKnownTokens: (u, address, tokens) => {
    u('main.tokens.known', address, (existing = []) => {
      const existingTokens = existing.filter(token => !includesToken(tokens, token))
      const tokensToAdd = tokens.map(t => ({ ...t, address: t.address.toLowerCase() }))

      return [...existingTokens, ...tokensToAdd]
    })
  },
  removeKnownTokens: (u, address, tokens) => {
    u('main.tokens.known', address, (existing = []) => {
      return existing.filter(token => !includesToken(tokens, token))
    })
  },
  setColorway: (u, colorway) => {
    u('main.colorway', () => {
      return colorway
    })
  },
  // Dashboard
  setDashType: (u, type) => {
    // console.log('set dash type', type)
    u('dash.type', () => type)
  },
  toggleDash: (u, force) => {
    u('dash.showing', s => force === 'hide' ? false : force === 'show' ? true : !s)
  },
  muteBetaDisclosure: (u) => {
    u('main.mute.betaDisclosure', () => true)
    u('dash.showing', () => true)
  },
  // Dapp Frame
  appDapp: (u, dapp) => {
    u('main.dapps', dapps => {
      if (dapps && !dapps[dapp.id]) {
        dapps[dapp.id] = dapp
      }
      return dapps || {}
    })
  },
  updateDapp: (u, dappId, update) => {
    u('main.dapps', dapps => {
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
    u('main.frames', frameId, frame => Object.assign({}, frame, update))
  },
  removeFrame: (u, frameId) => {
    u('main.frames', frames => {
      delete frames[frameId]
      return frames
    })
  },
  focusFrame: (u, frameId) => {
    u('main.focusedFrame', () => frameId)
  },
  addFrameView: (u, frameId, view) => {
    if (frameId && view) {
      u('main.frames', frameId, frame => {
        let existing
        Object.keys(frame.views).some(viewId => {
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
      u('main.frames', frameId, frame => {
        frame.currentView = viewId
        return frame
      })
    }
  },
  updateFrameView: (u, frameId, viewId, update) => {
    u('main.frames', frameId, 'views', views => {
      if ((update.show && views[viewId].ready) || (update.ready && views[viewId].show)) {
        Object.keys(views).forEach(id => {
          if (id !== viewId) views[id].show = false
        })
      }
      views[viewId] = Object.assign({}, views[viewId], update)
      return views
    })
  },
  removeFrameView: (u, frameId, viewId) => {
    u('main.frames', frameId, 'views', views => {
      delete views[viewId]
      return views
    })
  },
  unsetAccount: u => {
    u('selected.minimized', _ => true)
    u('selected.open', _ => false)
    u('selected.view', _ => 'default')
    u('selected.showAccounts', _ => false)
    setTimeout(_ => {
      u('selected', signer => {
        signer.last = signer.current
        signer.current = ''
        signer.requests = {}
        signer.view = 'default'
        return signer
      })
    }, 320)
  }
  // toggleUSDValue: (u) => {
  //   u('main.showUSDValue', show => !show)
  // }
  // __overwrite: (path, value) => u(path, () => value)
}
