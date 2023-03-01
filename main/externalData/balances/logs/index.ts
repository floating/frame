import { toTokenId } from '../../../../resources/domain/balance'
import { hexZeroPad } from '@ethersproject/bytes'
import { BigNumber } from '@ethersproject/bignumber'
import log from 'electron-log'
import { TokenDefinition } from 'nebula/dist/ipfs/manifest/tokens'
import { BytesLike, formatUnits } from 'ethers/lib/utils'
import type EthereumProvider from 'ethereum-provider'
import { erc20Interface } from '../../../../resources/contracts'

export enum LogTopic {
  TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  WITHDRAWAL = '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65',
  DEPOSIT = '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c'
}

type TokenId = string
type Address = string
type AccountBalances = Record<TokenId, Balance>

export interface Log {
  address: Address
  blockHash: string
  blockNumber: string
  data: string
  logIndex: string
  removed: boolean
  topics: string[]
  transactionHash: string
  transactionIndex: string
}

type TokensDict = Record<TokenId, TokenDefinition>

const toTokenDict = (definitions: TokenDefinition[]) =>
  definitions.reduce((tokens: TokensDict, token) => {
    const { address, chainId } = token
    tokens[toTokenId({ address, chainId: parseInt(chainId) })] = token
    return tokens
  }, {})

export class LogProcessor {
  private balances: AccountBalances = {}
  private ownerPadded

  private handlers: Record<LogTopic, (log: Log, tokensDict: TokensDict) => void> = {
    [LogTopic.TRANSFER]: this.handleTransfer.bind(this),
    [LogTopic.WITHDRAWAL]: this.handleWithdrawal.bind(this),
    [LogTopic.DEPOSIT]: this.handleDeposit.bind(this)
  }

  private async getTokenBalance(token: TokenDefinition) {
    const functionData = erc20Interface.encodeFunctionData('balanceOf', [this.owner])

    const response: BytesLike = await this.provider.request({
      method: 'eth_call',
      chainId: '0x' + Number(token.chainId).toString(16),
      params: [{ to: token.address, value: '0x0', data: functionData }, 'latest']
    })

    return BigNumber.from(response)._hex
  }

  private async processDelta(tokenId: TokenId, delta: BigNumber, tokens: TokensDict) {
    const existing = this.balances[tokenId]
    const tokenDefinition = tokens[tokenId]
    if (!existing && !tokenDefinition) {
      log.warn('Unsupported Token', { tokenId, chainId: this.chainId })
      return
    }

    const balance = existing ? delta.add(existing.balance)._hex : await this.getTokenBalance(tokenDefinition)

    const { decimals } = tokenDefinition || balance

    this.balances[tokenId] = {
      ...existing,
      ...tokenDefinition,
      chainId: this.chainId,
      balance,
      displayBalance: formatUnits(balance, decimals)
    }
  }

  private async handleTransfer(log: Log, tokens: TokensDict) {
    if (parseInt(log.blockNumber, 16) <= this.lastProcessedBlock) return
    const [, fromPadded, toPadded] = log.topics
    const tokenId = toTokenId({ address: log.address, chainId: this.chainId })
    const value = BigNumber.from(log.data)

    let delta = BigNumber.from(0)
    if (fromPadded === this.ownerPadded) delta = delta.add(value.mul(-1))
    if (toPadded === this.ownerPadded) delta = delta.add(value)

    await this.processDelta(tokenId, value, tokens)
  }

  private async handleWithdrawal(log: Log, tokens: TokensDict) {
    const [, addressPadded] = log.topics
    if (addressPadded !== this.ownerPadded) return

    const tokenId = toTokenId({ address: log.address, chainId: this.chainId })
    await this.processDelta(tokenId, BigNumber.from(log.data).mul(-1), tokens)
  }

  private async handleDeposit(log: Log, tokens: TokensDict) {
    const [, addressPadded] = log.topics
    if (addressPadded !== this.ownerPadded) return

    const tokenId = toTokenId({ address: log.address, chainId: this.chainId })
    await this.processDelta(tokenId, BigNumber.from(log.data), tokens)
  }

  private async handle(eventLog: Log, tokensDict: TokensDict) {
    const logBlock = parseInt(eventLog.blockNumber, 16)
    log.info('Processing logs', {
      lastProcessed: this.lastProcessedBlock,
      logBlock,
      process: logBlock > this.lastProcessedBlock
    })

    return logBlock > this.lastProcessedBlock
      ? this.handlers[eventLog.topics[0] as LogTopic](eventLog, tokensDict)
      : new Promise((r) => r(null))
  }

  public async process(logs: Log[], latestBlock: number, tokens: TokenDefinition[]) {
    log.info('Processing logs', { latestBlock, owner: this.owner })
    const tokensDict = toTokenDict(tokens)
    await Promise.all(logs.map((log) => this.handle(log, tokensDict)))
    this.lastProcessedBlock = latestBlock
    return Object.values(this.balances)
  }

  constructor(
    private owner: Address,
    balances: Balance[],
    public lastProcessedBlock: number,
    private chainId: number,
    private provider: EthereumProvider
  ) {
    balances.forEach((balance) => (this.balances[toTokenId(balance)] = balance))
    this.ownerPadded = hexZeroPad(owner, 32)
  }
}
