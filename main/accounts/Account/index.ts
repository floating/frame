import log from 'electron-log'
import { isValidAddress, addHexPrefix } from 'ethereumjs-util'
import BigNumber from 'bignumber.js'
import { Version } from 'eth-sig-util'

import { AccessRequest, AccountRequest, Accounts, RequestMode, TransactionRequest } from '..'
import nebulaApi from '../../nebula'
import signers from '../../signers'
import windows from '../../windows'
import nav from '../../windows/nav'
import store from '../../store'
import { Aragon } from '../aragon'
import { TransactionData } from '../../../resources/domain/transaction'
import { Type as SignerType, getSignerType } from '../../../resources/domain/signer'

import provider from '../../provider'
import { ApprovalType } from '../../../resources/constants'
import Erc20Contract from '../../contracts/erc20'

import reveal from '../../reveal'

const nebula = nebulaApi()

const storeApi = {
  getPermissions: function (address: Address) {
    return (store('main.permissions', address) || {}) as Record<string, Permission>
  }
}

interface SignerOptions {
  type?: string
}

interface AccountOptions {
  address?: Address,
  name: string,
  ensName?: string,
  created?: string,
  lastSignerType?: SignerType,
  smart?: SmartAccount,
  active: boolean,
  options: SignerOptions
}

class FrameAccount {
  id: Address
  address: Address
  name: string
  ensName?: string
  created: string
  smart?: SmartAccount

  lastSignerType: SignerType
  signer: string
  signerStatus: string
  aragon?: Aragon

  accounts: Accounts
  requests: Record<string, AccountRequest> = {}

  accountObserver: Observer

  status = 'ok'
  active = false

  constructor (params: AccountOptions, accounts: Accounts) {
    const { lastSignerType, name, ensName, created, address, smart, active, options = { } } = params
    this.accounts = accounts // Parent Accounts Module

    const formattedAddress = (address && address.toLowerCase()) || '0x'
    this.id = formattedAddress // Account ID
    this.address = formattedAddress
    this.lastSignerType = lastSignerType || (options.type as SignerType)

    this.active = active
    this.name = name
    this.ensName = ensName

    this.created = created || `new:${Date.now()}`

    this.signer = '' // Matched Signer ID
    this.signerStatus = ''

    if (smart) {
      this.smart = { ...smart, actor: (smart.actor || '').toLowerCase() }

      if (this.smart.type === 'aragon') {
        this.aragon = new Aragon(this.smart)
      }
    }

    const existingPermissions = storeApi.getPermissions(this.address)
    const currentSendDappPermission = Object.values(existingPermissions).find(p => ((p.origin || '').toLowerCase()).includes('send.frame.eth'))

    if (!currentSendDappPermission) {
      store.setPermission(this.address, { handlerId: 'send-dapp-native', origin: 'send.frame.eth', provider: true })
    }

    this.update()

    this.accountObserver = store.observer(() => {
      // When signer data changes in any way this will rerun to make sure we're matched correctly
      const updatedSigner = this.findSigner(this.address)

      if (updatedSigner) {
        if (this.signer !== updatedSigner.id || this.signerStatus !== updatedSigner.status) {
          this.signer = updatedSigner.id
          const signerType = getSignerType(updatedSigner.type)

          this.lastSignerType = signerType || this.lastSignerType
          this.signerStatus = updatedSigner.status

          if (updatedSigner.status === 'ok' && this.id === this.accounts._current) {
              this.verifyAddress(false, (err, verified) => {
              if (!err && !verified) this.signer = ''
            })
          }
        }
      } else {
        this.signer = ''
      }

      this.smart = this.signer ? undefined : this.smart

      this.update()
    }, `account:${this.address}`)

    if (this.created.split(':')[0] === 'new') {
      provider.on('connect', () => {
        provider.send({ jsonrpc: '2.0', id: 1, chainId: '0x1', method: 'eth_blockNumber', _origin: 'frame-internal', params: [] }, (response: any) => {
          if (response.result) this.created = parseInt(response.result, 16) + ':' + this.created.split(':')[1]
          this.update()
        })
      })
    }

    if (nebula.ready()) {
      this.lookupAddress() // We need to recheck this on every network change...
    } else {
      nebula.once('ready', this.lookupAddress.bind(this))
    }

    this.update()
  }

  async lookupAddress () {
    try {
      this.ensName = (await nebula.ens.reverseLookup(this.address))[0]
      this.update()
    } catch (e) {
      log.error('lookupAddress Error:', e)
      this.ensName = ''
      this.update()
    }
  }

  findSigner (address: Address) {
    const signers = store('main.signers') as Record<string, Signer>

    const signerOrdinal = (signer: Signer) => {
      const isOk = signer.status === 'ok' ? 2 : 1
      const signerIndex = Object.values(SignerType).findIndex(type => type === signer.type)
      const typeIndex = Math.max(signerIndex, 0)

      return isOk * typeIndex
    }

    const availableSigners = Object.values(signers)
      .filter(signer => signer.addresses.some(addr => addr.toLowerCase() === address))
      .sort((a, b) => signerOrdinal(b) - signerOrdinal(a))

    return availableSigners[0]
  }

  setAccess (req: AccessRequest, access: boolean) {
    const { handlerId, origin, account } = req
    if (account.toLowerCase() === this.address)  {
      // Permissions do no live inside the account summary
      const { name } = store('main.origins', origin)
      store.setPermission(this.address, { handlerId, origin: name, provider: access })
    }

    this.resolveRequest(req)
  }

  getRequest <T extends AccountRequest> (id: string) {
    return this.requests[id] as T
  }

  resolveRequest ({ handlerId, payload }: AccountRequest, result?: any) {
    const knownRequest = this.requests[handlerId]

    if (knownRequest) {
      if (knownRequest.res && payload) {
        const { id, jsonrpc } = payload
        knownRequest.res({ id, jsonrpc, result })
      }

      this.clearRequest(knownRequest)
    }
  }

  rejectRequest ({ handlerId, payload }: AccountRequest, error: EVMError) {
    const knownRequest = this.requests[handlerId]

    if (knownRequest) {
      if (knownRequest.res && payload) {
        const { id, jsonrpc } = payload
        knownRequest.res({ id, jsonrpc, error })
      }

      this.clearRequest(knownRequest)
    }
  }

  private clearRequest ({ handlerId }: AccountRequest) {
    store.navClearReq(handlerId)
    delete this.requests[handlerId]
    this.update()
  }

  addRequiredApproval (req: TransactionRequest, type: ApprovalType, data: any = {}, onApprove: (data: any) => void = () => {}) {
    // TODO: turn TransactionRequest into its own class
    const approve = (data: any) => {
      const confirmedApproval = req.approvals.find(a => a.type === type)

      if (confirmedApproval) {
        onApprove(data)

        confirmedApproval.approved = true
        this.update()
      }
    }

    req.approvals = [
      ...(req.approvals || []),
      {
        type,
        data,
        approved: false,
        approve
      }
    ]
  }

  resError (err: string | Error, payload: RPCResponsePayload, res: RPCErrorCallback) {
    const error = typeof err === 'string'
      ? { message: err, code: -1 }
      : err

    log.error(error)

    res({ id: payload.id, jsonrpc: payload.jsonrpc, error })
  }

  private async checkForErc20Approve (req: TransactionRequest) {
    const contractAddress = req.data.to
    if (!contractAddress) return

    const calldata = req.data.data
    if (!calldata) return

    const contract = new Erc20Contract(contractAddress, parseInt(req.data.chainId, 16))
    const decodedData = contract.decodeCallData(calldata)

    if (decodedData) {
      if (Erc20Contract.isApproval(decodedData)) {
        const spender = decodedData.args[0].toLowerCase()
        const amount = decodedData.args[1].toHexString()
        const { decimals, name, symbol } = await contract.getTokenData()
  
        this.addRequiredApproval(
          req,
          new BigNumber(amount).isZero() ? ApprovalType.TokenSpendRevocation : ApprovalType.TokenSpendApproval,
          {
            decimals,
            name,
            symbol,
            amount,
            contract: contractAddress,
            spender
          },
          (data: { amount: string }) => {
            // amount is a hex string
            const approvedAmount = new BigNumber(data.amount).toString()
            log.info(`changing approved amount for request ${req.handlerId} to ${approvedAmount}`)
  
            req.data.data = contract.encodeCallData('approve', [spender, data.amount])
  
            if (req.decodedData) {
              req.decodedData.args[1].value = approvedAmount
            }
          }
        )
        this.update()
      }
    }
  }

  private async recipientIdentity (req: TransactionRequest) {
    const { to, chainId } = req.data

    if (to) { // Get recipient identity
      try {
        const recipient = await reveal.identity(to, parseInt(chainId, 16))
        const knownTxRequest = this.requests[req.handlerId] as TransactionRequest
  
        if (recipient && knownTxRequest) {
          knownTxRequest.recipient = recipient.ens
          knownTxRequest.recipientType = recipient.type
          this.update()
        }
      } catch (e) {
        log.warn(e)
      }
    }
  }

  private async decodeCalldata (req: TransactionRequest) {
    const { to, chainId, data: calldata } = req.data

    if (to && calldata && calldata !== '0x' && parseInt(calldata, 16) !== 0) { 
      try { // Decode calldata
        const decodedData = await reveal.decode(to, parseInt(chainId, 16), calldata)
        const knownTxRequest = this.requests[req.handlerId] as TransactionRequest
  
        if (knownTxRequest && decodedData) {
          knownTxRequest.decodedData = decodedData
          this.update()
        } 
      } catch (e) {
        log.warn(e)
      }
    }
  }

  private async recognizeActions (req: TransactionRequest) {
    const { to, chainId, data: calldata } = req.data

    if (to && calldata && calldata !== '0x' && parseInt(calldata, 16) !== 0) { 
      try { // Recognize actions
        const actions = await reveal.recog(calldata, {
          contractAddress: to,
          chainId: parseInt(chainId, 16),
          account: this.address
        })

        const knownTxRequest = this.requests[req.handlerId] as TransactionRequest

        if (knownTxRequest && actions ) {
          knownTxRequest.recognizedActions = actions
          this.update()
        } 
      } catch (e) {
        log.warn(e)
      }
    }
  }

  private async revealDetails (req: TransactionRequest) {
    this.recipientIdentity(req)
    this.decodeCalldata(req)
    this.recognizeActions(req)
  }

  addRequest (req: any, res: RPCCallback<any> = () => {}) {
    const add = async (r: AccountRequest) => {
      this.requests[r.handlerId] = req
      this.requests[r.handlerId].mode = RequestMode.Normal
      this.requests[r.handlerId].created = Date.now()
      this.requests[r.handlerId].res = res

      if ((req || {}).type === 'transaction') {
        this.revealDetails(req)
        await this.checkForErc20Approve(req)
      }

      this.update()
      store.setSignerView('default')
      store.setPanelView('default')

      // Display request
      const { account } = req

      // Check if this account is open
      const accountOpen = store('selected.current') === account

      // Does the current panel nav include a 'requestView'
      const panelNav = store('windows.panel.nav') || []
      const inRequestView = panelNav.map((crumb: any) => crumb.view).includes('requestView')

      if (accountOpen && (!store('tray.open') || !inRequestView)) {
        const crumb = { 
          view: 'requestView', 
          data: { 
            step: 'confirm', accountId: account, requestId: req.handlerId 
          },
          position: {
            bottom: '200px'
          }
        } as const
        if (inRequestView) nav.back('panel')
        nav.forward('panel', crumb)
      }

      setTimeout(() => {
        windows.showTray()
      }, 100)
    }
    // Add a filter to make sure we're adding the request to an account that controls the outcome
    if (this.smart) {
      if (this.smart.type === 'aragon') {
        if (req.type === 'transaction') {
          const txRequest = (req as TransactionRequest)
          if (!this.aragon) return this.resError('Could not resolve Aragon account', txRequest.payload, res)
          const rawTx = txRequest.data
          rawTx.data = rawTx.data || '0x'
          this.aragon.pathTransaction(rawTx, (err, pathTx) => {
            if (err) return this.resError(err, req.payload, res)

            const tx = pathTx as TransactionData
            Object.keys(tx).forEach(key => { // Number to hex conversion
              const k = key as keyof RPC.SendTransaction.TxParams
              if (tx[k] && typeof tx[k] === 'number') tx[k] = addHexPrefix((tx[k] || 0).toString(16))
            })
            txRequest.data = tx
            add(req)
          })
        } else {
          add(req)
        }
      } else {
        add(req)
      }
    } else {
      add(req)
    }
  }

  getSigner () {
    if (this.smart) {
      const actingAccount = this.smart.actor && this.accounts.get(this.smart.actor)
      const actingSigner = actingAccount && signers.get(actingAccount.signer)
      return actingSigner 
    } else {
      return this.signer && signers.get(this.signer)
    }
  }

  verifyAddress (display: boolean, cb: Callback<boolean>) {
    if (this.smart && this.smart.actor) {
      const actingAccount = this.accounts.get(this.smart.actor)
      if (!actingAccount) return cb(new Error(`Could not find acting account: ${this.smart.actor}`))
      const actingSigner = signers.get(actingAccount.signer)
      if (!actingSigner || !actingSigner.verifyAddress) return cb(new Error(`Could not find acting account signer: ${actingAccount.signer}`))
      const index = actingSigner.addresses.map(a => a.toLowerCase()).indexOf(actingAccount.address)
      if (index > -1) {
        actingSigner.verifyAddress(index, actingAccount.address, display, cb)
      } else {
        log.info('Could not find address in signer')
        cb(new Error('Could not find address in signer'))
      }
    } else {
      const signer = signers.get(this.signer) || {}

      if (signer.verifyAddress && signer.status === 'ok') {
        const index = signer.addresses.map(a => a.toLowerCase()).indexOf(this.address)
        if (index > -1) {
          signer.verifyAddress(index, this.address, display, cb)
        } else {
          log.info('Could not find address in signer')
          cb(new Error('Could not find address in signer'))
        }
      } else {
        log.info('Signer not accessible to verify address')
        cb(new Error('Signer not accessible to verify address'))
      }
    }
  }

  getSelectedAddresses () {
    return [this.address]
  }

  getSelectedAddress () {
    return this.address
  }

  summary () {
    const update = JSON.parse(JSON.stringify({
      id: this.id,
      name: this.name,
      lastSignerType: this.lastSignerType,
      address: this.address,
      status: this.status,
      active: this.active,
      signer: this.signer,
      smart: this.smart,
      requests: this.requests,
      ensName: this.ensName,
      created: this.created
    })) as Account

    if (update.smart && update.smart.actor && update.smart.actor.account) {
      update.signer = update.smart.actor.account.signer
      if (update.signer) update.lastSignerType = SignerType.Aragon
    }
    return update
  }

  update () {
    this.accounts.update(this.summary())
  }

  rename (name: string) {
    this.name = name
    this.update()
  }

  getCoinbase (cb: Callback<Array<Address>>) {
    cb(null, [this.address])
  }

  getAccounts (cb?: Callback<Array<Address>>) {
    const account = this.address
    if (cb) cb(null, account ? [account] : [])
    return account ? [account] : []
  }

  close () {
    this.accountObserver.remove()
  }

  signMessage (message: string, cb: Callback<string>) {
    if (!message) return cb(new Error('No message to sign'))
    if (this.signer) {
      const s = signers.get(this.signer)
      if (!s) return cb(new Error(`Cannot find signer for this account`))
      const index = s.addresses.map(a => a.toLowerCase()).indexOf(this.address)
      if (index === -1) cb(new Error(`Signer cannot sign for this address`))
      s.signMessage(index, message, cb)
    } else if (this.smart) {
      if (this.smart && this.smart.actor) {
        const actingAccount = this.accounts.get(this.smart.actor)
        if (!actingAccount) return cb(new Error(`Could not find acting account: ${this.smart.actor}`))
        const actingSigner = signers.get(actingAccount.signer)
        if (!actingSigner || !actingSigner.verifyAddress) return cb(new Error(`Could not find acting account signer: ${actingAccount.signer}`))
        const index = actingSigner.addresses.map(a => a.toLowerCase()).indexOf(actingAccount.address)
        if (index === -1) cb(new Error('Acting signer cannot sign for this address, could not find address in signer'))
        actingSigner.signMessage(index, message, cb)
      } else {
        cb(new Error(`Agent's (${this.smart.agent}) signer is not ready`))
      }
    } else {
      cb(new Error('No signer found for this account'))
    }
  }

  signTypedData (version: Version, typedData: any, cb: Callback<string>) {
    if (!typedData) return cb(new Error('No data to sign'))
    if (typeof (typedData) !== 'object') return cb(new Error('Data to sign has the wrong format'))
    if (this.signer) {
      const s = signers.get(this.signer)
      if (!s) return cb(new Error(`Cannot find signer for this account`))
      const index = s.addresses.map(a => a.toLowerCase()).indexOf(this.address)
      if (index === -1) cb(new Error(`Signer cannot sign for this address`))
      s.signTypedData(index, version, typedData, cb)
    } else if (this.smart && this.smart.actor) {
      const actingAccount = this.accounts.get(this.smart.actor)
      if (!actingAccount) return cb(new Error(`Could not find acting account: ${this.smart.actor}`))
      const actingSigner = signers.get(actingAccount.signer)
      if (!actingSigner || !actingSigner.verifyAddress) return cb(new Error(`Could not find acting account signer: ${actingAccount.signer}`))
      const index = actingSigner.addresses.map(a => a.toLowerCase()).indexOf(actingAccount.address)
      if (index === -1) cb(new Error(`Acting signer cannot sign for this address, could not find acting address in signer: ${actingAccount.address}`))
      actingSigner.signTypedData(index, version, typedData, cb)
    } else {
      cb(new Error('No signer found for this account'))
    }
  }

  signTransaction (rawTx: TransactionData, cb: Callback<string>) {
    // if(index === typeof 'object' && cb === typeof 'undefined' && typeof rawTx === 'function') cb = rawTx; rawTx = index; index = 0;
    this.validateTransaction(rawTx, (err) => {
      if (err) return cb(err)
      if (this.signer) {
        const s = signers.get(this.signer)
        if (!s) return cb(new Error(`Cannot find signer for this account`))

        const index = s.addresses.map(a => a.toLowerCase()).indexOf(this.address)
        if (index === -1) cb(new Error(`Signer cannot sign for this address`))
        s.signTransaction(index, rawTx, cb)
      } else if (this.smart && this.smart.actor) {
        const actingAccount = this.accounts.get(this.smart.actor)
        if (!actingAccount) return cb(new Error(`Could not find acting account: ${this.smart.actor}`))
        const actingSigner = signers.get(actingAccount.signer)
        if (!actingSigner || !actingSigner.verifyAddress) return cb(new Error(`Could not find acting account signer: ${actingAccount.signer}`))
        const index = actingSigner.addresses.map(a => a.toLowerCase()).indexOf(actingAccount.address)
        if (index === -1) cb(new Error(`Acting signer cannot sign for this address, could not find acting address in signer: ${actingAccount.address}`))
        actingSigner.signTransaction(index, rawTx, cb)
      } else {
        cb(new Error('No signer found for this account'))
      }
    })
  }

  private validateTransaction (rawTx: TransactionData, cb: Callback<void>) {
    // Validate 'from' address
    if (!rawTx.from) return new Error('Missing \'from\' address')
    if (!isValidAddress(rawTx.from)) return cb(new Error('Invalid \'from\' address'))

    // Ensure that transaction params are valid hex strings
    const enforcedKeys: Array<keyof TransactionData> = ['value', 'data', 'to', 'from', 'gas', 'gasPrice', 'gasLimit', 'nonce']
    const keys = Object.keys(rawTx) as Array<keyof TransactionData>

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      if (enforcedKeys.indexOf(key) > -1 && !this.isValidHexString(rawTx[key] as string)) {
        // Break on first error
        cb(new Error(`Transaction parameter '${key}' is not a valid hex string`))
        break
      }
    }
    return cb(null)
  }

  private isValidHexString (str: string) {
    const pattern = /^0x[0-9a-fA-F]*$/
    return pattern.test(str)
  }
}

export default FrameAccount
