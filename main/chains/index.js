// status = Network Mismatch, Not Connected, Connected, Standby, Syncing
const { powerMonitor } = require('electron')
const EventEmitter = require('events')
const { addHexPrefix } = require('@ethereumjs/util')
const { Hardfork } = require('@ethereumjs/common')
const { estimateL1GasCost } = require('@eth-optimism/sdk')
const { Web3Provider } = require('@ethersproject/providers')
const BigNumber = require('bignumber.js')
const provider = require('eth-provider')
const log = require('electron-log')

const store = require('../store').default
const { default: BlockMonitor } = require('./blocks')
const { default: chainConfig } = require('./config')
const { default: GasMonitor } = require('../transaction/gasMonitor')
const { createGasCalculator } = require('./gas')
const { NETWORK_PRESETS } = require('../../resources/constants')
const { chainUsesOptimismFees } = require('../../resources/utils/chains')

// These chain IDs are known to not support EIP-1559 and will be forced
// not to use that mechanism
// TODO: create a more general chain config that can use the block number
// and ethereumjs/common to determine the state of various EIPs
// Note that Arbitrum is in the list because it does not currently charge priority fees
// https://support.arbitrum.io/hc/en-us/articles/4415963644955-How-the-fees-are-calculated-on-Arbitrum
const legacyChains = [250, 4002, 42161]

const resError = (error, payload, res) =>
  res({
    id: payload.id,
    jsonrpc: payload.jsonrpc,
    error: typeof error === 'string' ? { message: error, code: -1 } : error
  })

function txEstimate(gasCost, nativeUSD) {
  const usd = gasCost.shiftedBy(-18).multipliedBy(nativeUSD).toNumber()

  return {
    gasEstimate: addHexPrefix(gasCost.toString(16)),
    cost: {
      usd
    }
  }
}

class ChainConnection extends EventEmitter {
  constructor(type, chainId) {
    super()
    this.type = type
    this.chainId = chainId

    // default chain config to istanbul hardfork until a block is received
    // to update it to london
    this.chainConfig = chainConfig(parseInt(this.chainId), 'istanbul')

    // TODO: maybe this can be tied into chain config somehow
    this.gasCalculator = createGasCalculator(this.chainId)

    this.primary = {
      status: 'off',
      network: '',
      type: '',
      currentTarget: '',
      connected: false
    }

    this.secondary = {
      status: 'off',
      network: '',
      type: '',
      currentTarget: '',
      connected: false
    }

    this.observer = store.observer(() => {
      const chain = store('main.networks', type, chainId)
      if (chain) this.connect(chain)
    })
  }

  _createProvider(target, priority) {
    log.debug('createProvider', { chainId: this.chainId, priority })

    this.update(priority)

    this[priority].provider = provider(target, {
      name: priority,
      origin: 'frame'
    })

    this[priority].blockMonitor = this._createBlockMonitor(this[priority].provider, priority)
  }

  _handleConnection(priority) {
    this._updateStatus(priority, 'connected')
    this.emit('connect')
  }

  async txEstimates(type, id, gasPrice, currentSymbol, provider) {
    const sampleEstimates = [
      {
        label: `Send ${currentSymbol}`,
        txExample: {
          value: '0x8e1bc9bf04000',
          data: '0x00',
          gasLimit: addHexPrefix((21000).toString(16))
        }
      },
      {
        label: 'Send Tokens',
        txExample: {
          value: '0x00',
          data: '0xa9059cbb000000000000000000000000c1af8ca40dfe1cb43b9c7a8c93df762c2d6ecfd90000000000000000000000000000000000000000000000008ac7230489e80000',
          gasLimit: addHexPrefix((65000).toString(16))
        }
      },
      {
        label: 'Dex Swap',
        txExample: {
          value: '0x13e1e16b2a10c9',
          data: '0x049639fb0000000000000000000000000000000000000000000000000000000000000004000000000000000000000000eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee00000000000000000000000042000000000000000000000000000000000000420000000000000000000000000000000000000000000000000013e1e16b2a10c900000000000000000000000000000000000000000000000045575639011cb45400000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000038812aa3caf000000000000000000000000b63aae6c353636d66df13b89ba4425cfe13d10ba00000000000000000000000042000000000000000000000000000000000000060000000000000000000000004200000000000000000000000000000000000042000000000000000000000000b63aae6c353636d66df13b89ba4425cfe13d10ba000000000000000000000000a7ca2c8673bcfa5a26d8ceec2887f2cc2b0db22a0000000000000000000000000000000000000000000000000013e1e16b2a10c900000000000000000000000000000000000000000000000045575639011cb455000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000001400000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001f50000000000000000000000000000000000000000000000000000000001d700a007e5c0d20000000000000000000000000000000000000000000000000001b30001505126a132dab612db5cb9fc9ac426a0cc215a3423f9c942000000000000000000000000000000000000060004f41766d8000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000011edea400000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000b63aae6c353636d66df13b89ba4425cfe13d10ba0000000000000000000000000000000000000000000000000000000065e75a70000000000000000000000000000000000000000000000000000000000000000100000000000000000000000042000000000000000000000000000000000000060000000000000000000000007f5c764cbc14f9669b88837ca1490cca17c31607000000000000000000000000000000000000000000000000000000000000000102a000000000000000000000000000000000000000000000000045575639011cb455ee63c1e5801d751bc1a723accf1942122ca9aa82d49d08d2ae7f5c764cbc14f9669b88837ca1490cca17c316071111111254eeb25477b68fb85ed929f73a96058200000000000000000000000bd34b36000000000000000000000000000000000000000000000000',
          gasLimit: addHexPrefix((200000).toString(16))
        }
      }
    ]

    const isTestnet = store('main.networks', type, id, 'isTestnet')
    const nativeCurrency = store('main.networksMeta', type, id, 'nativeCurrency')
    const nativeUSD = BigNumber(
      nativeCurrency && nativeCurrency.usd && !isTestnet ? nativeCurrency.usd.price : 0
    )

    let estimates

    if (chainUsesOptimismFees(id) && !isTestnet) {
      estimates = await Promise.all(
        sampleEstimates.map(async ({ label, txExample }) => {
          const tx = {
            ...txExample,
            type: 2,
            chainId: id
          }

          try {
            const l1GasCost = BigNumber((await estimateL1GasCost(provider, tx)).toHexString())
            const l2GasCost = BigNumber(tx.gasLimit).multipliedBy(gasPrice)
            const estimatedGas = l1GasCost.plus(l2GasCost)

            return {
              label,
              gasCost: estimatedGas
            }
          } catch (e) {
            return {
              label,
              gasCost: BigNumber('')
            }
          }
        })
      )
    } else {
      estimates = sampleEstimates.map(({ label, txExample }) => ({
        label,
        gasCost: BigNumber(txExample.gasLimit).multipliedBy(gasPrice)
      }))
    }

    return estimates.map(({ label, gasCost }) => ({
      estimates: {
        low: txEstimate(gasCost, nativeUSD),
        high: txEstimate(gasCost, nativeUSD)
      },
      label
    }))
  }

  async feeEstimatesUSD(chainId, gasPrice, provider) {
    const type = 'ethereum'
    const currentSymbol = store('main.networksMeta', type, chainId, 'nativeCurrency', 'symbol') || 'ETH'

    return this.txEstimates(type, chainId, gasPrice, currentSymbol, provider)
  }

  _createBlockMonitor(provider) {
    const monitor = new BlockMonitor(provider)
    const allowEip1559 = !legacyChains.includes(parseInt(this.chainId))

    monitor.on('data', async (block) => {
      log.debug(`Updating to block ${parseInt(block.number)} for chain ${parseInt(this.chainId)}`)

      let feeMarket = null

      const gasMonitor = new GasMonitor(provider)

      if (allowEip1559 && 'baseFeePerGas' in block) {
        try {
          // only consider this an EIP-1559 block if fee market can be loaded
          const feeHistory = await gasMonitor.getFeeHistory(20, [10, 60])
          feeMarket = this.gasCalculator.calculateGas(feeHistory)

          this.chainConfig.setHardforkByBlockNumber(block.number)

          if (!this.chainConfig.gteHardfork(Hardfork.London)) {
            // if baseFeePerGas is present in the block header, the hardfork
            // must be at least London
            this.chainConfig.setHardfork(Hardfork.London)
          }
        } catch (e) {
          feeMarket = null
          // log.error(`could not load EIP-1559 fee market for chain ${this.chainId}`, e)
        }
      }

      try {
        if (feeMarket) {
          const gasPrice = parseInt(feeMarket.maxBaseFeePerGas) + parseInt(feeMarket.maxPriorityFeePerGas)

          store.setGasPrices(this.type, this.chainId, { fast: addHexPrefix(gasPrice.toString(16)) })
          store.setGasDefault(this.type, this.chainId, 'fast')
        } else {
          const gas = await gasMonitor.getGasPrices()
          const customLevel = store('main.networksMeta', this.type, this.chainId, 'gas.price.levels.custom')

          store.setGasPrices(this.type, this.chainId, {
            ...gas,
            custom: customLevel || gas.fast
          })
        }

        if (provider.connected) {
          const gasPrice = store('main.networksMeta', this.type, this.chainId, 'gas.price.levels.slow')
          const estimatedGasPrice = feeMarket
            ? BigNumber(feeMarket.nextBaseFee).plus(BigNumber(feeMarket.maxPriorityFeePerGas))
            : BigNumber(gasPrice)

          this.feeEstimatesUSD(parseInt(this.chainId), estimatedGasPrice, new Web3Provider(provider)).then(
            (samples) => {
              store.addSampleGasCosts(this.type, this.chainId, samples)
            }
          )
        }

        store.setGasFees(this.type, this.chainId, feeMarket)
        store.setBlockHeight(this.chainId, parseInt(block.number, 16))

        this.emit('update', { type: 'fees' })
      } catch (e) {
        log.error(`could not update gas prices for chain ${this.chainId}`, { feeMarket }, e)
      }
    })

    return monitor
  }

  update(priority) {
    const network = store('main.networks', this.type, this.chainId)

    if (!network) {
      // since we poll to re-connect there may be a timing issue where we try
      // to update a network after it's been removed, so double-check here
      return
    }

    if (priority === 'primary') {
      const { status, connected, type, network } = this.primary
      const details = { status, connected, type, network }
      log.info(`Updating primary connection for chain ${this.chainId}`, details)
      store.setPrimary(this.type, this.chainId, details)
    } else if (priority === 'secondary') {
      const { status, connected, type, network } = this.secondary
      const details = { status, connected, type, network }
      log.info(`Updating secondary connection for chain ${this.chainId}`, details)
      store.setSecondary(this.type, this.chainId, details)
    }
  }

  getNetwork(provider, cb) {
    provider.sendAsync({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }, (err, response) => {
      try {
        response.result =
          !err && response && !response.error ? parseInt(response.result, 'hex').toString() : ''
        cb(err, response)
      } catch (e) {
        cb(e)
      }
    })
  }

  getNodeType(provider, cb) {
    provider.sendAsync({ jsonrpc: '2.0', method: 'web3_clientVersion', params: [], id: 1 }, cb)
  }

  _updateStatus(priority, status) {
    log.debug('Chains.updateStatus', { priority, status })

    this[priority].status = status
    this.update(priority)

    this.emit('update', { type: 'status', status })
  }

  resetConnection(priority /* 'primary' | 'secondary' */, status, target) {
    log.debug('resetConnection', { priority, status, target })

    const provider = this[priority].provider

    this.killProvider(provider)
    this[priority].provider = null
    this[priority].connected = false
    this[priority].type = ''

    this.stopBlockMonitor(priority)

    if (['off', 'disconnected', 'standby'].includes(status)) {
      if (this[priority].status !== status) {
        if (['off', 'disconnected'].includes(status)) {
          this[priority].network = ''
        }

        this._updateStatus(priority, status)
      }
    } else {
      this[priority].currentTarget = target
      this[priority].status = status
    }
  }

  killProvider(provider) {
    log.debug('killProvider', { provider })

    if (provider) {
      provider.close()
      provider.removeAllListeners()
    }
  }

  stopBlockMonitor(priority) {
    log.debug('stopBlockMonitor', { chainId: this.chainId, priority })

    if (this[priority].blockMonitor) {
      this[priority].blockMonitor.stop()
      this[priority].blockMonitor.removeAllListeners()
      this[priority].blockMonitor = null
    }
  }

  connect(chain) {
    const connection = chain.connection

    log.info(this.type + ':' + this.chainId + "'s connection has been updated")

    if (this.network !== connection.network) {
      this.killProvider(this.primary.provider)
      this.primary.provider = null
      this.killProvider(this.secondary.provider)
      this.secondary.provider = null
      this.primary = { status: 'loading', network: '', type: '', connected: false }
      this.secondary = { status: 'loading', network: '', type: '', connected: false }
      this.update('primary')
      this.update('secondary')
      log.info('Network changed from ' + this.network + ' to ' + connection.network)
      this.network = connection.network
    }

    const currentPresets = { ...NETWORK_PRESETS.ethereum.default, ...NETWORK_PRESETS.ethereum[this.chainId] }

    const { primary, secondary } = store('main.networks', this.type, this.chainId, 'connection')
    const secondaryTarget =
      secondary.current === 'custom' ? secondary.custom : currentPresets[secondary.current]

    if (chain.on && connection.secondary.on) {
      log.info('Secondary connection: ON')

      if (connection.primary.on && connection.primary.status === 'connected') {
        // Connection is on Standby
        log.info('Secondary connection on STANDBY', connection.secondary.status === 'standby')

        this.resetConnection('secondary', 'standby')
      } else if (!secondaryTarget) {
        // if no target is provided automatically set state to disconnected
        this.resetConnection('secondary', 'disconnected')
      } else if (!this.secondary.provider || this.secondary.currentTarget !== secondaryTarget) {
        log.info("Creating secondary connection because it didn't exist or the target changed", {
          secondaryTarget
        })

        this.resetConnection('secondary', 'loading', secondaryTarget)
        this._createProvider(secondaryTarget, 'secondary')

        this.secondary.provider.on('connect', () => {
          log.info('Secondary connection connected')
          this.getNetwork(this.secondary.provider, (err, response) => {
            if (err) {
              this.primary.connected = false
              this.primary.type = ''
              this.primary.status = 'error'
              this.update('secondary')

              this._updateStatus('secondary', 'error')
            } else {
              this.secondary.network = !err && response && !response.error ? response.result : ''
              if (this.secondary.network && this.secondary.network !== this.chainId) {
                this.secondary.connected = false
                this.secondary.type = ''
                this._updateStatus('secondary', 'chain mismatch')
              } else {
                this.secondary.connected = true
                this.secondary.type = ''

                this._handleConnection('secondary')
              }
            }
          })
        })
        this.secondary.provider.on('close', () => {
          log.info('Secondary connection close')
          this.secondary.connected = false
          this.secondary.type = ''
          this.secondary.network = ''
          this.update('secondary')
          this.emit('close')
        })
        this.secondary.provider.on('status', (status) => {
          if (status === 'connected' && this.secondary.network && this.secondary.network !== this.chainId) {
            this.secondary.connected = false
            this.secondary.type = ''
            this._updateStatus('secondary', 'chain mismatch')
          } else if (this.secondary.status !== status) {
            this._updateStatus('secondary', status)
          }
        })
        this.secondary.provider.on('data', (data) => this.emit('data', data))
        this.secondary.provider.on('error', (err) => this.emit('error', err))
      }
    } else {
      // Secondary connection is set to OFF by the user
      log.info('Secondary connection: OFF')

      this.resetConnection('secondary', 'off')
    }

    const primaryTarget = primary.current === 'custom' ? primary.custom : currentPresets[primary.current]

    if (chain.on && connection.primary.on) {
      log.info('Primary connection: ON')

      if (!primaryTarget) {
        // if no target is provided automatically set state to disconnected
        this.resetConnection('primary', 'disconnected')
      } else if (!this.primary.provider || this.primary.currentTarget !== primaryTarget) {
        log.info("Creating primary connection because it didn't exist or the target changed", {
          primaryTarget
        })

        this.resetConnection('primary', 'loading', primaryTarget)
        this._createProvider(primaryTarget, 'primary')

        this.primary.provider.on('connect', () => {
          log.info(`    Primary connection for network ${this.chainId} connected`)
          this.getNetwork(this.primary.provider, (err, response) => {
            if (err) {
              this.primary.connected = false
              this.primary.type = ''

              this._updateStatus('primary', 'error')
            } else {
              this.primary.network = !err && response && !response.error ? response.result : ''
              if (this.primary.network && this.primary.network !== this.chainId) {
                this.primary.connected = false
                this.primary.type = ''
                this._updateStatus('primary', 'chain mismatch')
              } else {
                this.primary.connected = true
                this.primary.type = ''

                this._handleConnection('primary')
              }
            }
          })
        })
        this.primary.provider.on('close', () => {
          log.info('Primary connection close')
          this.primary.connected = false
          this.primary.type = ''
          this.primary.network = ''

          this.update('primary')
          this.emit('close')
        })
        this.primary.provider.on('status', (status) => {
          if (status === 'connected' && this.primary.network && this.primary.network !== this.chainId) {
            this.primary.connected = false
            this.primary.type = ''

            this._updateStatus('primary', 'chain mismatch')
          } else if (this.primary.status !== status) {
            this._updateStatus('primary', status)
          }
        })
        this.primary.provider.on('data', (data) => this.emit('data', data))
        this.primary.provider.on('error', (err) => this.emit('error', err))
      }
    } else {
      log.info('Primary connection: OFF')
      this.resetConnection('primary', 'off')
    }
  }

  close(update = true) {
    log.verbose(`closing chain ${this.chainId}`, { update })

    if (this.observer) this.observer.remove()

    this.killProvider(this.primary.provider)
    this.stopBlockMonitor('primary')
    this.primary.provider = null

    this.killProvider(this.secondary.provider)
    this.stopBlockMonitor('secondary')
    this.secondary.provider = null

    if (update) {
      this.primary = { status: 'loading', network: '', type: '', connected: false }
      this.secondary = { status: 'loading', network: '', type: '', connected: false }
      this.update('primary')
      this.update('secondary')
    }
  }

  send(payload, res) {
    if (this.primary.provider && this.primary.connected) {
      this.primary.provider.sendAsync(payload, (err, result) => {
        if (err) return resError(err, payload, res)
        res(result)
      })
    } else if (this.secondary.provider && this.secondary.connected) {
      this.secondary.provider.sendAsync(payload, (err, result) => {
        if (err) return resError(err, payload, res)
        res(result)
      })
    } else {
      resError('Not connected to Ethereum network', payload, res)
    }
  }
}

class Chains extends EventEmitter {
  constructor() {
    super()
    this.connections = {}

    const removeConnection = (chainId, type = 'ethereum') => {
      if (type in this.connections && chainId in this.connections[type]) {
        this.connections[type][chainId].removeAllListeners()
        this.connections[type][chainId].close(false)
        delete this.connections[type][chainId]
      }
    }

    const updateConnections = () => {
      const networks = store('main.networks')

      Object.keys(this.connections).forEach((type) => {
        Object.keys(this.connections[type]).forEach((chainId) => {
          if (!networks[type][chainId]) {
            removeConnection(chainId, type)
          }
        })
      })

      Object.keys(networks).forEach((type) => {
        this.connections[type] = this.connections[type] || {}
        Object.keys(networks[type]).forEach((chainId) => {
          const chainConfig = networks[type][chainId]
          if (chainConfig.on && !this.connections[type][chainId]) {
            this.connections[type][chainId] = new ChainConnection(type, chainId)

            this.connections[type][chainId].on('connect', (...args) => {
              this.emit('connect', { type, id: chainId }, ...args)
            })

            this.connections[type][chainId].on('close', (...args) => {
              this.emit('close', { type, id: chainId }, ...args)
            })

            this.connections[type][chainId].on('data', (...args) => {
              this.emit('data', { type, id: chainId }, ...args)
            })

            this.connections[type][chainId].on('update', (...args) => {
              this.emit('update', { type, id: parseInt(chainId) }, ...args)
            })

            this.connections[type][chainId].on('error', (...args) => {
              this.emit('error', { type, id: chainId }, ...args)
            })
          } else if (!chainConfig.on && this.connections[type][chainId]) {
            this.connections[type][chainId].removeAllListeners()
            this.connections[type][chainId].close()
            delete this.connections[type][chainId]
          }
        })
      })
    }

    powerMonitor.on('resume', () => {
      const activeConnections = Object.keys(this.connections)
        .map((type) => Object.keys(this.connections[type]).map((chainId) => `${type}:${chainId}`))
        .flat()

      log.info('System resuming, resetting active connections', { chains: activeConnections })

      activeConnections.forEach((id) => {
        const [type, chainId] = id.split(':')
        removeConnection(chainId, type)
      })

      updateConnections()
    })

    store.observer(updateConnections, 'chains:connections')
  }

  send(payload, res, targetChain) {
    if (!targetChain) {
      resError({ message: `Target chain did not exist for send`, code: -32601 }, payload, res)
    }
    const { type, id } = targetChain
    if (!this.connections[type] || !this.connections[type][id]) {
      resError(
        { message: `Connection for ${type} chain with chainId ${id} did not exist for send`, code: -32601 },
        payload,
        res
      )
    } else {
      this.connections[type][id].send(payload, res)
    }
  }
}

module.exports = new Chains()
