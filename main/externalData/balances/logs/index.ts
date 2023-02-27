import { toTokenId } from '../../../../resources/domain/balance'
import { hexZeroPad } from '@ethersproject/bytes'
import { BigNumber } from '@ethersproject/bignumber'
import { utils } from 'ethers'
import log from 'electron-log'
import { TokenDefinition } from '../scan'

//TODO: plumb changes of token list / custom tokens into metadata so that we know which tokens to handle...
export enum LogTopic {
  TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
  WITHDRAWAL = '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65',
  DEPOSIT = '0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c'
}

type TokenId = string
type Address = string
type AccountBalances = Record<TokenId, Balance>

interface Log {
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

const metadata: Record<TokenId, TokenDefinition> = {}

export const setMetadata = (tokens: TokenDefinition[]) => {
  tokens.forEach((token) => (metadata[toTokenId(token)] = token))
}

export class LogProcessor {
  private balances: AccountBalances = {}
  private ownerPadded

  private handlers: Record<LogTopic, (chainId: number, log: Log) => void> = {
    [LogTopic.TRANSFER]: this.handleTransfer,
    [LogTopic.WITHDRAWAL]: this.handleWithdrawal,
    [LogTopic.DEPOSIT]: this.handleDeposit
  }

  private async processDelta(tokenId: TokenId, delta: BigNumber) {
    const existing = this.balances[tokenId]
    if (!existing) {
      if (!metadata[tokenId]) {
        log.warn('Unsupported token', { tokenId })
        return
      }
      log.info('Token with known metadata but no seeded balance...', { tokenId })
      //TODO:
      //Fetch balance from chain, set the balance to this...
      return
    }

    const { balance: currentBalance, decimals } = existing

    const newBalance = delta.add(currentBalance)
    this.balances[tokenId].balance = newBalance.toString()
    this.balances[tokenId].displayBalance = utils.formatUnits(newBalance, decimals)
  }

  private async handleTransfer(chainId: number, log: Log) {
    if (parseInt(log.blockNumber, 16) <= this.lastProcessedBlock) return
    const [fromPadded, toPadded, valueHex] = log.topics
    const tokenId = toTokenId({ address: log.address, chainId })
    const value = BigNumber.from(valueHex)

    let delta = BigNumber.from(0)
    if (fromPadded === this.ownerPadded) delta = delta.add(value.mul(-1))
    if (toPadded === this.ownerPadded) delta = delta.add(value)

    await this.processDelta(tokenId, value)
  }

  private async handleWithdrawal(chainId: number, log: Log) {
    const [addressPadded, valueHex] = log.topics
    if (addressPadded !== this.ownerPadded) return

    const tokenId = toTokenId({ address: log.address, chainId })
    await this.processDelta(tokenId, BigNumber.from(valueHex).mul(-1))
  }

  private async handleDeposit(chainId: number, log: Log) {
    const [addressPadded, valueHex] = log.topics
    if (addressPadded !== this.ownerPadded) return

    const tokenId = toTokenId({ address: log.address, chainId })
    await this.processDelta(tokenId, BigNumber.from(valueHex))
  }

  public async process(chainId: number, logs: Log[], latestBlock: number) {
    log.info('Processing logs', { latestBlock, chainId, owner: this.owner })
    await Promise.all(logs.map((log) => this.handlers[log.topics[0] as LogTopic](chainId, log)))
    this.lastProcessedBlock = latestBlock
    return Object.values(this.balances)
  }

  constructor(private owner: Address, balances: Balance[], public lastProcessedBlock: number) {
    balances.forEach((balance) => (this.balances[toTokenId(balance)] = balance))
    this.ownerPadded = hexZeroPad(owner, 32)
  }
}
