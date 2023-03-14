import { z } from 'zod'

import { AccountMetadataSchema, AccountSchema } from './account'
import { BalanceSchema } from './balance'
import { ChainMetadataSchema, ChainSchema } from './chain'
import { ColorwayPrimarySchema } from './colors'
import { DappSchema } from './dapp'
import { OriginSchema } from './origin'
import { PermissionSchema } from './permission'

export type { ChainId, Chain, ChainMetadata } from './chain'
export type { Connection } from './connection'
export type { Origin } from './origin'
export type { Permission } from './permission'
export type { Account, AccountMetadata } from './account'
export type { Balance } from './balance'
export type { WithTokenId, Token } from './token'
export type { Dapp } from './dapp'
export type { NativeCurrency } from './nativeCurrency'
export type { Gas, GasFees } from './gas'
export type { Rate } from './rate'
export type { ColorwayPalette } from './colors'

const UpdaterPreferencesSchema = z.object({
  dontRemind: z.array(z.string())
})

const PreferencesSchema = {
  launch: z.boolean().default(false).describe('Launch Frame on system start'),
  reveal: z.boolean().default(false).describe('Show Frame when user glides mouse to edge of screen'),
  autohide: z.boolean().default(false).describe('Automatically hide Frame when it loses focus'),
  accountCloseLock: z
    .boolean()
    .default(false)
    .describe("Lock an account when it's closed instead of when Frame restarts"),
  showLocalNameWithENS: z.boolean(),
  menubarGasPrice: z.boolean().default(false).describe('Show gas price in menu bar'),
  hardwareDerivation: z.string()
}

const MainSchema = z.object({
  _version: z.coerce.number(),
  instanceId: z.string(), // TODO: uuid
  networks: z.object({
    ethereum: z.record(z.coerce.number(), ChainSchema)
  }),
  networksMeta: z.object({
    ethereum: z.record(z.coerce.number(), ChainMetadataSchema)
  }),
  origins: z.record(z.string().describe('Origin Id'), OriginSchema),
  knownExtensions: z.record(z.string(), z.boolean()),
  permissions: z.record(
    z.string().describe('Address'),
    z.record(z.string().describe('Origin Id'), PermissionSchema)
  ),
  accounts: z.record(z.string(), AccountSchema),
  accountsMeta: z.record(z.string(), AccountMetadataSchema),
  balances: z.record(z.string().describe('Address'), z.array(BalanceSchema)),
  dapps: z.record(z.string(), DappSchema),
  colorway: z.enum(['light', 'dark']),
  colorwayPrimary: ColorwayPrimarySchema,
  updater: UpdaterPreferencesSchema,
  ...PreferencesSchema
})

export const StateSchema = z.object({
  main: MainSchema
})

export type Main = z.infer<typeof MainSchema>
export type State = z.infer<typeof StateSchema>
