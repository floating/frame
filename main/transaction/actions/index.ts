import type { ActionType as Erc20Actions } from './erc20'
import type { ActionType as EnsActions } from './ens'

export type EntityType = 'unknown' | 'contract' | 'external'
export type ActionType = Erc20Actions | EnsActions

export type Action<T> = {
  id: ActionType
  data?: T
  update?: (params: Partial<T>) => {}
}

type DecodeContext = {
  account?: Address
}

type DecodeFunction<T> = (calldata: string, context?: DecodeContext) => Action<T> | undefined

export interface DecodableContract<T> {
  name: string
  address: Address
  chainId: number
  decode: DecodeFunction<T>
}
