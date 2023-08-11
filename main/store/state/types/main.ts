import { z } from 'zod'
import { v4 as uuid } from 'uuid'

import { AccountMetadataSchema, AccountSchema } from './account'
import { BalanceSchema } from './balance'
import { EthereumChainsSchema } from './chain'
import { EthereumChainsMetadataSchema } from './chainMeta'
import { ColorwayPrimarySchema } from './colors'
import { DappSchema } from './dapp'
import { FrameSchema } from './frame'
import { MuteSchema } from './mute'
import { KnownOriginsSchema } from './origin'
import { PermissionSchema } from './permission'
import { PrivacySchema } from './privacy'
import { ShortcutsSchema } from './shortcuts'
import { TokenBalanceSchema, TokenSchema } from './token'
import { SignerSchema } from './signer'
import { AssetPreferencesSchema } from './preferences'
import { RatesSchema } from './rate'
import { currentVersion } from '..'

const UpdaterPreferencesSchema = z.object({
  dontRemind: z.array(z.string())
})

// these are individual keys on the main state object
const MainPreferences = {
  launch: z.boolean().default(false).describe('Launch Frame on system start'),
  reveal: z.boolean().default(false).describe('Show Frame when user glides mouse to edge of screen'),
  autohide: z.boolean().default(false).describe('Automatically hide Frame when it loses focus'),
  accountCloseLock: z
    .boolean()
    .default(false)
    .describe("Lock an account when it's closed instead of when Frame restarts"),
  showLocalNameWithENS: z.boolean(),
  menubarGasPrice: z.boolean().default(false).describe('Show gas price in menu bar')
}

const defaultValues = {
  instanceId: uuid()
}

export const MainSchema = z
  .object({
    _version: z.coerce.number().default(currentVersion),
    instanceId: z.string().catch(defaultValues.instanceId).default(defaultValues.instanceId),
    networks: EthereumChainsSchema,
    networksMeta: EthereumChainsMetadataSchema
    // origins: KnownOriginsSchema,
    // knownExtensions: z.record(z.string(), z.boolean()),
    // assetPreferences: AssetPreferencesSchema,
    // permissions: z.record(
    //   z.string().describe('Address'),
    //   z.record(z.string().describe('Origin Id'), PermissionSchema)
    // ),
    // tokens: z.object({
    //   custom: z.array(TokenSchema),
    //   known: z.record(z.string(), z.array(TokenBalanceSchema))
    // }),
    // accounts: z.record(z.string(), AccountSchema),
    // accountsMeta: z.record(z.string(), AccountMetadataSchema),
    // signers: z.record(z.string(), SignerSchema),
    // balances: z.record(z.string().describe('Address'), z.array(BalanceSchema)),
    // dapps: z.record(z.string(), DappSchema),
    // mute: MuteSchema,
    // privacy: PrivacySchema,
    // colorway: z.enum(['light', 'dark']),
    // colorwayPrimary: ColorwayPrimarySchema,
    // shortcuts: ShortcutsSchema,
    // updater: UpdaterPreferencesSchema,
    // frames: z.record(z.string(), FrameSchema),
    // rates: RatesSchema,
    // ...MainPreferences
  })
  .default({})

export type Main = z.infer<typeof MainSchema>
