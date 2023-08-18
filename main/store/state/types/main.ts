import { z } from 'zod'

import { AccountMetadataSchema, AccountSchema } from './account'
import { BalanceSchema } from './balances'
import { EthereumChainsSchema } from './chains'
import { EthereumChainsMetadataSchema } from './chainMeta'
import { ColorwayPrimarySchema } from './colorway'
import { DappSchema } from './dapps'
import { FrameSchema } from './frame'
import { MuteSchema } from './mute'
import { KnownOriginsSchema } from './origins'
import { PermissionSchema } from './permissions'
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

export const MainSchema = z
  .object({
    // knownExtensions: z.record(z.string(), z.boolean()),
    // assetPreferences: AssetPreferencesSchema,
    // tokens: z.object({
    //   custom: z.array(TokenSchema),
    //   known: z.record(z.string(), z.array(TokenBalanceSchema))
    // }),
    // accounts: z.record(z.string(), AccountSchema),
    // accountsMeta: z.record(z.string(), AccountMetadataSchema),
    signers: z.record(z.string(), SignerSchema).default({})
    // balances: z.record(z.string().describe('Address'), z.array(BalanceSchema)),
    // dapps: z.record(z.string(), DappSchema),
    // privacy: PrivacySchema,
    // shortcuts: ShortcutsSchema,
    // updater: UpdaterPreferencesSchema,
    // frames: z.record(z.string(), FrameSchema),
    // ...MainPreferences
  })
  .default({})

export type Main = z.infer<typeof MainSchema>
