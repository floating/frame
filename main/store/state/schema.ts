import { z } from 'zod'
import { v4 as uuid } from 'uuid'

import { currentVersion } from '.'

import { latest as ChainsSchema } from './types/chains'
import { latest as ChainMetadataSchema } from './types/chainMeta'
import { latest as ColorwaySchema } from './types/colorway'
import { latest as MuteSchema } from './types/mute'
import { latest as PermissionsSchema } from './types/permissions'
import { latest as OriginsSchema } from './types/origins'
import { latest as DappsSchema } from './types/dapps'
import { latest as BalancesSchema } from './types/balances'
import { latest as RatesSchema } from './types/rates'
import { latest as ShortcutsSchema } from './types/shortcuts'

const defaultValues = {
  instanceId: uuid()
}

const State = z.object({
  main: z.object({
    _version: z.coerce.number().default(currentVersion),
    instanceId: z.string().catch(defaultValues.instanceId).default(defaultValues.instanceId),
    colorway: ColorwaySchema,
    networks: ChainsSchema,
    networksMeta: ChainMetadataSchema,
    mute: MuteSchema,
    permissions: PermissionsSchema,
    origins: OriginsSchema,
    dapps: DappsSchema,
    balances: BalancesSchema,
    rates: RatesSchema,
    shortcuts: ShortcutsSchema
  })
})

export default State
