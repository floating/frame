import { z } from 'zod'
import { v4 as uuid } from 'uuid'

import { currentVersion } from '..'

import { latest as MainSettingsSchema } from '../types/main'
import { latest as ChainsSchema } from '../types/chains'
import { latest as ChainMetadataSchema } from '../types/chainMeta'
import { latest as AccountsSchema } from '../types/accounts'
import { latest as AccountMetadataSchema } from '../types/accountMetadata'
import { latest as SignersSchema } from '../types/signers'
import { latest as ColorwaySchema } from '../types/colorway'
import { latest as MuteSchema } from '../types/mute'
import { latest as PermissionsSchema } from '../types/permissions'
import { latest as KnownExtensionsSchema } from '../types/extensions'
import { latest as OriginsSchema } from '../types/origins'
import { latest as PrivacySettingsSchema } from '../types/privacy'
import { latest as DappsSchema } from '../types/dapps'
import { latest as DappSettingsSchema } from '../types/dappSettings'
import { latest as FramesSchema } from '../types/frames'
import { latest as BalancesSchema } from '../types/balances'
import { latest as InventorySchema } from '../types/inventory'
import { latest as AssetPreferencesSchema } from '../types/assetPreferences'
import { latest as RatesSchema } from '../types/rates'
import { latest as ShortcutsSchema } from '../types/shortcuts'
import { latest as UpdaterSchema } from '../types/updater'
import { latest as TrezorSettingsSchema } from '../types/trezor'
import { latest as LedgerSettingsSchema } from '../types/ledger'
import { latest as LatticeSettingsSchema } from '../types/lattice'

const defaultValues = {
  instanceId: uuid()
}

// these nodes need default values but don't yet have well-defined types
const defaultNodes = {
  lattice: z.object({}).passthrough().catch({}).default({}),
  ipfs: z.object({}).passthrough().catch({}).default({}),
  openDapps: z.array(z.any()).catch([]).default([])
}

const topLevelSettings = MainSettingsSchema.shape

const main = z.object({
  _version: z.coerce.number().default(currentVersion),
  instanceId: z.string().catch(defaultValues.instanceId).default(defaultValues.instanceId),
  colorway: ColorwaySchema,
  networks: ChainsSchema,
  networksMeta: ChainMetadataSchema,
  accounts: AccountsSchema,
  accountsMeta: AccountMetadataSchema,
  signers: SignersSchema,
  mute: MuteSchema,
  permissions: PermissionsSchema,
  origins: OriginsSchema,
  knownExtensions: KnownExtensionsSchema,
  privacy: PrivacySettingsSchema,
  dapps: DappsSchema,
  dapp: DappSettingsSchema,
  frames: FramesSchema,
  balances: BalancesSchema,
  inventory: InventorySchema,
  assetPreferences: AssetPreferencesSchema,
  rates: RatesSchema,
  shortcuts: ShortcutsSchema,
  updater: UpdaterSchema,
  trezor: TrezorSettingsSchema,
  ledger: LedgerSettingsSchema,
  latticeSettings: LatticeSettingsSchema,
  // TODO: finish implementing this
  tokens: z.any().catch({ custom: [], known: {} }).default({ custom: [], known: {} }),
  ...topLevelSettings,
  ...defaultNodes
})

export default main
