import { v4 as generateUuid, v5 as uuidv5 } from 'uuid'
import { z } from 'zod'
import log from 'electron-log'

import persist from '../persist'
import migrations from '../migrate'
import { queueError } from '../../errors/queue'

import StateSchema from './schema'
import type { Dapp } from './types/dapps'

// export type { HardwareSignerType, HotSignerType, SignerType, Signer } from './types/signer'
// export type { Account, AccountMetadata } from './types/account'
// export type { WithTokenId, Token, TokenBalance } from './types/token'
// //export type { Dapp } from './types/dapp'
// export type { NativeCurrency } from './types/nativeCurrency'
// export type { Frame, ViewMetadata } from './types/frame'
// export type { InventoryAsset, InventoryCollection, Inventory } from './types/inventory'
// export type { Media } from './types/media'
// export type { AssetPreferences } from './types/preferences'

const currentVersion = 41
const currentBaseState = { main: { _version: currentVersion } } as StateVersion

// const StateSchema = z
//   .object({
//     main: MainSchema, // TODO: remove passthrough once all pieces of state have been defined
//     windows: z.any().default({
//       panel: {
//         show: false,
//         nav: [],
//         footer: {
//           height: 40
//         }
//       },
//       dash: {
//         show: false,
//         nav: [],
//         footer: {
//           height: 40
//         }
//       },
//       frames: []
//     }),
//     view: z.any().default({}),
//     selected: z.any().default({}),
//     panel: z.any().default({}),
//     tray: z.any().default({}),
//     platform: z.string().default(process.platform)
//   })
//   .default({})

type StateVersion = {
  main: {
    _version: number
  }
}

type VersionedState = {
  __: Record<number, StateVersion>
}

function loadState() {
  const state = persist.get('main') as Record<string, unknown> | undefined

  if (!state) {
    log.verbose('Persisted state: no state found')
    return currentBaseState
  }

  if (!state.__) {
    log.verbose('Persisted state: legacy state found, returning base state')
    return state as StateVersion
  }

  const versionedState = state as VersionedState

  const versions = Object.keys(versionedState.__)
    .map((v) => parseInt(v))
    .filter((v) => v <= migrations.latest)
    .sort((a, b) => a - b)

  if (versions.length === 0) {
    log.verbose('Persisted state: no valid state versions found')
    return currentBaseState
  }

  const latest = versions[versions.length - 1]
  log.verbose('Persisted state: returning latest state', { version: latest })
  return versionedState.__[latest]
}

const main = (path: string, def: any) => {
  const found = undefined //get(path)
  if (found === undefined) return def
  return found
}

const mainState = {
  _version: main('_version', 41),
  instanceId: main('instanceId', generateUuid()),
  colorway: main('colorway', 'dark'),
  colorwayPrimary: {
    dark: {
      background: 'rgb(26, 22, 28)',
      text: 'rgb(241, 241, 255)'
    },
    light: {
      background: 'rgb(240, 230, 243)',
      text: 'rgb(20, 40, 60)'
    }
  },
  shortcuts: {
    altSlash: main('shortcuts.altSlash', true),
    summon: main('shortcuts.summon', {
      modifierKeys: ['Alt'],
      shortcutKey: 'Slash',
      enabled: true,
      configuring: false
    })
  },
  // showUSDValue: main('showUSDValue', true),
  launch: main('launch', false),
  reveal: main('reveal', false),
  showLocalNameWithENS: main('showLocalNameWithENS', false),
  autohide: main('autohide', false),
  accountCloseLock: main('accountCloseLock', false),
  hardwareDerivation: main('hardwareDerivation', 'mainnet'),
  menubarGasPrice: main('menubarGasPrice', false),
  lattice: main('lattice', {}),
  latticeSettings: {
    accountLimit: main('latticeSettings.accountLimit', 5),
    derivation: main('latticeSettings.derivation', 'standard'),
    endpointMode: main('latticeSettings.endpointMode', 'default'),
    endpointCustom: main('latticeSettings.endpointCustom', '')
  },
  ledger: {
    derivation: main('ledger.derivation', 'live'),
    liveAccountLimit: main('ledger.liveAccountLimit', 5)
  },
  trezor: {
    derivation: main('trezor.derivation', 'standard')
  },
  knownExtensions: main('knownExtensions', {}),
  privacy: {
    errorReporting: main('privacy.errorReporting', true)
  },
  accounts: main('accounts', {}),
  accountsMeta: main('accountsMeta', {}),
  addresses: main('addresses', {}), // Should be removed after 0.5 release
  assetPreferences: main('assetPreferences', {
    tokens: {},
    collections: {}
  }),
  tokens: main('tokens', { custom: [], known: {} }),
  inventory: {}, // main('rates', {}),
  signers: {},
  updater: {
    dontRemind: main('updater.dontRemind', [])
  },
  dapps: main('dapps', {}),
  ipfs: {},
  frames: {},
  openDapps: [],
  dapp: {
    details: {},
    map: {
      added: [],
      docked: []
    },
    storage: {},
    removed: []
  }
}

const initial = {
  panel: {
    // Panel view
    showing: false,
    nav: [],
    show: false,
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
  },
  flow: {},
  dapps: {},
  view: {
    current: '',
    list: [],
    data: {},
    notify: '',
    notifyData: {},
    badge: '',
    addAccount: '', // Add view (needs to be merged into Phase)
    addNetwork: false, // Phase view (needs to be merged with Add)
    clickGuard: false
  },
  signers: {},
  tray: {
    open: false,
    initial: true
  },
  balances: {},
  selected: {
    minimized: true,
    open: false,
    current: '',
    view: 'default',
    settings: {
      viewIndex: 0,
      views: ['permissions', 'verify', 'control'],
      subIndex: 0
    },
    addresses: [],
    showAccounts: false,
    accountPage: 0,
    position: {
      scrollTop: 0,
      initial: {
        top: 5,
        left: 5,
        right: 5,
        bottom: 5,
        height: 5,
        index: 0
      }
    }
  },
  frame: {
    type: 'tray'
  },
  node: {
    provider: false
  },
  provider: {
    events: []
  },
  external: {
    rates: {}
  },
  platform: process.platform,
  main: mainState
}

// --- remove state that should not persist from session to session
initial.main.knownExtensions = Object.fromEntries(
  Object.entries(initial.main.knownExtensions).filter(([_id, allowed]) => allowed)
)

initial.main.dapps = Object.fromEntries(
  Object.entries(initial.main.dapps as Record<string, Dapp>).map(([id, dapp]) => [
    id,
    { ...dapp, openWhenReady: false }
  ])
)

// ---

export { currentVersion }
export type { StateVersion }

export default function () {
  const persistedState = loadState()

  const migratedState = migrations.apply(persistedState)
  const result = StateSchema.safeParse(migratedState)

  if (!result.success) {
    // this can only happen if the state is corrupted in an unrecoverable way
    queueError(result.error)

    const issues = result.error.issues
    log.warn(`Found ${issues.length} issues while parsing saved state`, issues)

    const defaultState = StateSchema.safeParse(currentBaseState)

    return defaultState.success && defaultState.data
  }

  return result.data
}
