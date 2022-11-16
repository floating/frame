import type { Action, EntityType } from '.'

export type ActionType = 'erc20:approve' | 'erc20:revoke' | 'erc20:transfer'

type Erc20Spend = {
  amount: HexAmount
  decimals: number
  name: string
  symbol: string,
  contract: Address
}

type Erc20Approve = Erc20Spend & {
  spender: Address
  spenderEns?: string
  spenderType: EntityType
}

type Erc20Transfer = Erc20Spend & {
  recipient: Address
  recipientEns?: string
  recipientType: EntityType
}

export type ApproveAction = Action<Erc20Approve>
export type TransferAction = Action<Erc20Transfer>
