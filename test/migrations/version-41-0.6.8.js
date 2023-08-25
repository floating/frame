const input = undefined

const output = {
  main: {
    _version: 41,
    instanceId: 'f70b1ab8-1ad1-4b22-af22-1f104939d05d',
    colorway: 'dark',
    mute: {
      alphaWarning: false,
      welcomeWarning: false,
      externalLinkWarning: false,
      explorerWarning: false,
      signerRelockChange: false,
      gasFeeWarning: false,
      betaDisclosure: false,
      onboardingWindow: false,
      migrateToPylon: true,
      signerCompatibilityWarning: false
    },
    shortcuts: {
      summon: {
        modifierKeys: ['Alt'],
        shortcutKey: 'Slash',
        enabled: true,
        configuring: false
      }
    },
    launch: false,
    reveal: false,
    showLocalNameWithENS: false,
    autohide: false,
    accountCloseLock: false,
    menubarGasPrice: false,
    lattice: {},
    latticeSettings: {
      accountLimit: 5,
      derivation: 'standard',
      endpointMode: 'default',
      endpointCustom: ''
    },
    ledger: {
      derivation: 'live',
      liveAccountLimit: 5
    },
    trezor: {
      derivation: 'standard'
    },
    origins: {},
    knownExtensions: {},
    privacy: {
      errorReporting: true
    },
    accounts: {},
    accountsMeta: {},
    permissions: {},
    balances: {},
    assetPreferences: {
      tokens: {},
      collections: {}
    },
    tokens: {
      custom: [],
      known: {}
    },
    rates: {},
    inventory: {},
    signers: {},
    updater: {
      dontRemind: []
    },
    networks: {
      ethereum: {
        1: {
          id: 1,
          type: 'ethereum',
          layer: 'mainnet',
          name: 'Mainnet',
          isTestnet: false,
          explorer: 'https://etherscan.io',
          on: true,
          connection: {
            primary: {
              on: true,
              current: 'pylon',
              status: 'loading',
              connected: false,
              custom: ''
            },
            secondary: {
              on: false,
              current: 'custom',
              status: 'loading',
              connected: false,
              custom: ''
            }
          }
        },
        5: {
          id: 5,
          type: 'ethereum',
          layer: 'testnet',
          isTestnet: true,
          name: 'Görli',
          explorer: 'https://goerli.etherscan.io',
          on: false,
          connection: {
            primary: {
              on: true,
              current: 'pylon',
              status: 'loading',
              connected: false,
              custom: ''
            },
            secondary: {
              on: false,
              current: 'custom',
              status: 'loading',
              connected: false,
              custom: ''
            }
          }
        },
        10: {
          id: 10,
          type: 'ethereum',
          layer: 'rollup',
          isTestnet: false,
          name: 'Optimism',
          explorer: 'https://optimistic.etherscan.io',
          on: false,
          connection: {
            primary: {
              on: true,
              current: 'pylon',
              status: 'loading',
              connected: false,
              custom: ''
            },
            secondary: {
              on: false,
              current: 'custom',
              status: 'loading',
              connected: false,
              custom: ''
            }
          }
        },
        100: {
          id: 100,
          type: 'ethereum',
          layer: 'sidechain',
          isTestnet: false,
          name: 'Gnosis',
          explorer: 'https://blockscout.com/xdai/mainnet',
          on: false,
          connection: {
            primary: {
              on: false,
              current: 'custom',
              status: 'loading',
              connected: false,
              custom: 'https://rpc.gnosischain.com'
            },
            secondary: {
              on: false,
              current: 'custom',
              status: 'loading',
              connected: false,
              custom: ''
            }
          }
        },
        137: {
          id: 137,
          type: 'ethereum',
          layer: 'sidechain',
          isTestnet: false,
          name: 'Polygon',
          explorer: 'https://polygonscan.com',
          on: false,
          connection: {
            primary: {
              on: true,
              current: 'pylon',
              status: 'loading',
              connected: false,
              custom: ''
            },
            secondary: {
              on: false,
              current: 'custom',
              status: 'loading',
              connected: false,
              custom: ''
            }
          }
        },
        8453: {
          id: 8453,
          type: 'ethereum',
          layer: 'rollup',
          isTestnet: false,
          name: 'Base',
          explorer: 'https://basescan.org',
          connection: {
            primary: {
              on: true,
              current: 'pylon',
              status: 'loading',
              connected: false,
              custom: ''
            },
            secondary: {
              on: false,
              current: 'custom',
              status: 'loading',
              connected: false,
              custom: ''
            }
          },
          on: false
        },
        42161: {
          id: 42161,
          type: 'ethereum',
          layer: 'rollup',
          isTestnet: false,
          name: 'Arbitrum',
          explorer: 'https://arbiscan.io',
          on: false,
          connection: {
            primary: {
              on: true,
              current: 'pylon',
              status: 'loading',
              connected: false,
              custom: ''
            },
            secondary: {
              on: false,
              current: 'custom',
              status: 'loading',
              connected: false,
              custom: ''
            }
          }
        },
        84531: {
          id: 84531,
          type: 'ethereum',
          layer: 'testnet',
          isTestnet: true,
          name: 'Base Görli',
          explorer: 'https://goerli-explorer.base.org',
          on: false,
          connection: {
            primary: {
              on: true,
              current: 'custom',
              status: 'loading',
              connected: false,
              custom: 'https://goerli.base.org'
            },
            secondary: {
              on: false,
              current: 'custom',
              status: 'loading',
              connected: false,
              custom: ''
            }
          }
        },
        11155111: {
          id: 11155111,
          type: 'ethereum',
          layer: 'testnet',
          isTestnet: true,
          name: 'Sepolia',
          explorer: 'https://sepolia.etherscan.io',
          on: false,
          connection: {
            primary: {
              on: true,
              current: 'pylon',
              status: 'loading',
              connected: false,
              custom: ''
            },
            secondary: {
              on: false,
              current: 'custom',
              status: 'loading',
              connected: false,
              custom: ''
            }
          }
        }
      }
    },
    networksMeta: {
      ethereum: {
        1: {
          blockHeight: 0,
          gas: {
            fees: null,
            price: {
              selected: 'standard',
              levels: {
                slow: '',
                standard: '',
                fast: '',
                asap: '',
                custom: ''
              }
            }
          },
          nativeCurrency: {
            symbol: 'ETH',
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png?1595348880',
            name: 'Ether',
            decimals: 18
          },
          icon: '',
          primaryColor: 'accent1'
        },
        5: {
          blockHeight: 0,
          gas: {
            fees: null,
            price: {
              selected: 'standard',
              levels: {
                slow: '',
                standard: '',
                fast: '',
                asap: '',
                custom: ''
              }
            }
          },
          nativeCurrency: {
            symbol: 'görETH',
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: '',
            name: 'Görli Ether',
            decimals: 18
          },
          icon: '',
          primaryColor: 'accent2'
        },
        10: {
          blockHeight: 0,
          gas: {
            fees: null,
            price: {
              selected: 'standard',
              levels: {
                slow: '',
                standard: '',
                fast: '',
                asap: '',
                custom: ''
              }
            }
          },
          nativeCurrency: {
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: '',
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/optimism.svg',
          primaryColor: 'accent4'
        },
        100: {
          blockHeight: 0,
          gas: {
            fees: null,
            price: {
              selected: 'standard',
              levels: {
                slow: '',
                standard: '',
                fast: '',
                asap: '',
                custom: ''
              }
            }
          },
          nativeCurrency: {
            symbol: 'xDAI',
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: '',
            name: 'xDAI',
            decimals: 18
          },
          icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/gnosis.svg',
          primaryColor: 'accent5'
        },
        137: {
          blockHeight: 0,
          gas: {
            fees: null,
            price: {
              selected: 'standard',
              levels: {
                slow: '',
                standard: '',
                fast: '',
                asap: '',
                custom: ''
              }
            }
          },
          nativeCurrency: {
            symbol: 'MATIC',
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: '',
            name: 'Matic',
            decimals: 18
          },
          icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/polygon.svg',
          primaryColor: 'accent6'
        },
        8453: {
          blockHeight: 0,
          gas: {
            fees: null,
            price: {
              selected: 'standard',
              levels: {
                slow: '',
                standard: '',
                fast: '',
                asap: '',
                custom: ''
              }
            }
          },
          nativeCurrency: {
            symbol: 'ETH',
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: '',
            name: 'Ether',
            decimals: 18
          },
          icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/baseiconcolor.png',
          primaryColor: 'accent8'
        },
        42161: {
          blockHeight: 0,
          gas: {
            fees: null,
            price: {
              selected: 'standard',
              levels: {
                slow: '',
                standard: '',
                fast: '',
                asap: '',
                custom: ''
              }
            }
          },
          nativeCurrency: {
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: '',
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
          },
          icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/arbitrum.svg',
          primaryColor: 'accent7'
        },
        84531: {
          blockHeight: 0,
          gas: {
            fees: null,
            price: {
              selected: 'standard',
              levels: {
                slow: '',
                standard: '',
                fast: '',
                asap: '',
                custom: ''
              }
            }
          },
          nativeCurrency: {
            symbol: 'görETH',
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: '',
            name: 'Görli Ether',
            decimals: 18
          },
          icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/baseiconcolor.png',
          primaryColor: 'accent2'
        },
        11155111: {
          blockHeight: 0,
          gas: {
            fees: null,
            price: {
              selected: 'standard',
              levels: {
                slow: '',
                standard: '',
                fast: '',
                asap: '',
                custom: ''
              }
            }
          },
          nativeCurrency: {
            symbol: 'sepETH',
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: '',
            name: 'Sepolia Ether',
            decimals: 18
          },
          icon: '',
          primaryColor: 'accent2'
        }
      }
    },
    dapps: {},
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
  },
  keyboardLayout: {
    isUS: true
  },
  tray: {
    open: false,
    initial: true
  },
  windows: {
    frames: [],
    panel: {
      nav: [],
      showing: false,
      footer: {
        height: 40
      }
    },
    dash: {
      nav: [],
      showing: false,
      footer: {
        height: 40
      }
    }
  },
  panel: {
    nav: [],
    view: 'default',
    account: {
      moduleOrder: ['requests', 'chains', 'balances', 'inventory', 'permissions', 'signer', 'settings'],
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
  selected: {
    minimized: true,
    open: false,
    showAccounts: false,
    current: '',
    view: 'default',
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
  platform: 'linux'
}

export { input, output }
