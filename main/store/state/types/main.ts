import { z } from 'zod'

import { AccountMetadataSchema, AccountSchema } from './account'
import { BalanceSchema } from './balance'
import { ChainMetadataSchema, ChainSchema } from './chain'
import { ColorwayPrimarySchema } from './colors'
import { DappSchema } from './dapp'
import { OriginSchema } from './origin'
import { PermissionSchema } from './permission'

const UpdaterPreferencesSchema = z.object({
  dontRemind: z.array(z.string())
})

// these are individual keys on the main state object
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

const notificationTypes = z.enum([
  'alphaWarning',
  'welcomeWarning',
  'externalLinkWarning',
  'explorerWarning',
  'signerRelockChange',
  'gasFeeWarning',
  'betaDisclosure',
  'onboardingWindow',
  'signerCompatibilityWarning',
  'migrateToPylon'
])

export const MainSchema = z.object({
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
  mute: z.record(notificationTypes, z.boolean()),
  colorway: z.enum(['light', 'dark']),
  colorwayPrimary: ColorwayPrimarySchema,
  updater: UpdaterPreferencesSchema,
  ...PreferencesSchema
})

export type Main = z.infer<typeof MainSchema>
