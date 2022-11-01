import type { Action } from '.'

export type ActionType =
  'ens:commit' |
  'ens:register' |
  'ens:renew' |
  'ens:transfer' |
  'ens:approve'

type Named = { name: string }
type WithTokenId = { tokenId: string }
type WithDuration = { duration: number }

type Transfer = Named & WithTokenId & {
  from: Address
  to: Address
}

type Approve = Named & WithTokenId & {
  operator: Address
}

type Register = Named & WithDuration & {
  address: Address
}

type Renew = Named & WithDuration

export type TransferAction = Action<Transfer>
export type ApproveAction = Action<Approve>
export type RegisterAction = Action<Register>
export type RenewAction = Action<Renew>
