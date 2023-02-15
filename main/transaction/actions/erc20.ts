import type { Action, EntityType } from '.'
import { Identity } from '../../accounts/types'

export type ActionType = 'erc20:approve' | 'erc20:revoke' | 'erc20:transfer'

type Erc20Spend = {
  amount: HexAmount
  decimals: number
  name: string
  symbol: string
  contract: Address
}

type Erc20Approve = Erc20Spend & {
  spender: Identity
  contract: Identity
}

type Erc20Transfer = Erc20Spend & {
  recipient: Identity
}

export type ApproveAction = Action<Erc20Approve>
export type TransferAction = Action<Erc20Transfer>
