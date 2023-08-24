import { z } from 'zod'
import { AddressSchema } from '../types/common'
import { schemaWithEmptyDefaults } from './util'

const modules = [
  'requests',
  'chains',
  'balances',
  'inventory',
  'permissions',
  'signer',
  'settings',
  'activity',
  'gas',
  'verify'
] as const

const enabledModules = z.enum(modules)

const ModuleSchema = z.object({
  height: z.number().default(0)
})

const AccountSchema = z.object({
  moduleOrder: z
    .array(enabledModules)
    .default(['requests', 'chains', 'balances', 'inventory', 'permissions', 'signer', 'settings']),
  modules: z.record(ModuleSchema).default({
    requests: { height: 0 },
    activity: { height: 0 },
    balances: { height: 0 },
    inventory: { height: 0 },
    permissions: { height: 0 },
    verify: { height: 0 },
    gas: { height: 100 }
  })
})

const panel = z
  .object({
    account: schemaWithEmptyDefaults(AccountSchema),
    nav: z.array(z.any()).default([]),
    view: z.string().default('default')
  })
  .passthrough()

export default schemaWithEmptyDefaults(panel)

/*
panel: {
    // Panel view
    view: 'default',
    viewData: '',
    account: {
      moduleOrder: [
        'requests',
        // 'activity',
        // 'gas',
        'chains',
        'balances',
        'inventory',
        'permissions',
        // 'verify',
        'signer',
        'settings'
      ],
      modules: {
        requests: {
          height: 0
        },
        activity: {
          height: 0
        },
        balances: {
          height: 0
        },
        inventory: {
          height: 0
        },
        permissions: {
          height: 0
        },
        verify: {
          height: 0
        },
        gas: {
          height: 100
        }
      }
    }
  }
  */
