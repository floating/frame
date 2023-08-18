import { z } from 'zod'
import { v4 as uuid } from 'uuid'

import { currentVersion } from '.'

import { latest as MainSettingsSchema } from './types/main'
import { latest as ChainsSchema } from './types/chains'
import { latest as ChainMetadataSchema } from './types/chainMeta'
import { latest as AccountsSchema } from './types/accounts'
import { latest as AccountMetadataSchema } from './types/accountMetadata'
import { latest as SignersSchema } from './types/signers'
import { latest as ColorwaySchema } from './types/colorway'
import { latest as MuteSchema } from './types/mute'
import { latest as PermissionsSchema } from './types/permissions'
import { latest as KnownExtensionsSchema } from './types/extensions'
import { latest as OriginsSchema } from './types/origins'
import { latest as PrivacySettingsSchema } from './types/privacy'
import { latest as DappsSchema } from './types/dapps'
import { latest as FramesSchema } from './types/frames'
import { latest as BalancesSchema } from './types/balances'
import { latest as InventorySchema } from './types/inventory'
import { latest as AssetPreferencesSchema } from './types/assetPreferences'
import { latest as RatesSchema } from './types/rates'
import { latest as ShortcutsSchema } from './types/shortcuts'
import { latest as UpdaterSchema } from './types/updater'

const defaultValues = {
  instanceId: uuid()
}

const State = z.object({
  main: z
    .object({
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
      frames: FramesSchema,
      balances: BalancesSchema,
      inventory: InventorySchema,
      assetPreferences: AssetPreferencesSchema,
      rates: RatesSchema,
      shortcuts: ShortcutsSchema,
      updater: UpdaterSchema
      // tokens: z.object({
      //   custom: z.array(TokenSchema),
      //   known: z.record(z.string(), z.array(TokenBalanceSchema))
      // }),
    })
    .extend(MainSettingsSchema.shape)
})

export default State
