const input = {
  _version: 6,
  mute: {
    alphaWarning: false,
    welcomeWarning: true,
    externalLinkWarning: false,
    explorerWarning: false,
    signerRelockChange: false,
    gasFeeWarning: false
  },
  shortcuts: {
    altSlash: true
  },
  launch: true,
  reveal: false,
  nonceAdjust: false,
  autohide: false,
  accountCloseLock: false,
  hardwareDerivation: 'mainnet',
  menubarGasPrice: false,
  ledger: {
    derivation: 'live',
    liveAccountLimit: 5
  },
  trezor: {
    derivation: 'standard'
  },
  accounts: {
    '3962313363386161636464323432666631363965386638393033343037656330': {
      id: '3962313363386161636464323432666631363965386638393033343037656330',
      index: 0,
      network: '1',
      name: 'Ring Account',
      type: 'ring',
      addresses: ['0xbad0fc6b8a20bee2daee7a1eeef448afb880cbf6'],
      status: 'ok',
      signer: {
        id: '3962313363386161636464323432666631363965386638393033343037656330',
        type: 'ring',
        addresses: ['0xbad0fc6b8a20bee2daee7a1eeef448afb880cbf6'],
        status: 'locked',
        network: '1',
        liveAddressesFound: 0
      },
      requests: {},
      created: '0x1110b44'
    }
  },
  addresses: {
    '0xbad0fc6b8a20bee2daee7a1eeef448afb880cbf6': {
      tokens: {}
    }
  },
  signers: {
    '3962313363386161636464323432666631363965386638393033343037656330': {
      id: '3962313363386161636464323432666631363965386638393033343037656330',
      type: 'ring',
      addresses: ['0xbad0fc6b8a20bee2daee7a1eeef448afb880cbf6'],
      status: 'locked',
      network: '1',
      liveAddressesFound: 0
    }
  },
  savedSigners: {},
  updater: {
    dontRemind: []
  },
  clients: {
    ipfs: {
      on: false,
      installed: false,
      latest: false,
      version: null,
      state: 'off'
    },
    geth: {
      on: false,
      blockNumber: 0,
      currentBlock: 0,
      highestBlock: 0,
      installed: false,
      latest: false,
      version: null,
      state: 'off'
    },
    parity: {
      on: false,
      blockNumber: 0,
      currentBlock: 0,
      highestBlock: 0,
      installed: false,
      latest: false,
      version: null,
      state: 'off'
    }
  },
  currentNetwork: {
    type: 'ethereum',
    id: '1'
  },
  networkPresets: {
    ethereum: {
      1: {
        alchemy: [
          'wss://eth-mainnet.ws.alchemyapi.io/v2/NBms1eV9i16RFHpFqQxod56OLdlucIq0',
          'https://eth-mainnet.alchemyapi.io/v2/NBms1eV9i16RFHpFqQxod56OLdlucIq0'
        ],
        infura: 'infura'
      },
      3: {
        infura: 'infuraRopsten'
      },
      4: {
        infura: 'infuraRinkeby'
      },
      5: {
        prylabs: 'https://goerli.prylabs.net',
        mudit: 'https://rpc.goerli.mudit.blog',
        slockit: 'https://rpc.slock.it/goerli',
        infura: [
          'wss://goerli.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b',
          'https://goerli.infura.io/ws/v3/786ade30f36244469480aa5c2bf0743b'
        ]
      },
      42: {
        infura: 'infuraKovan'
      },
      74: {
        idchain: 'wss://idchain.one/ws/'
      },
      100: {
        poa: 'https://dai.poa.network'
      },
      137: {
        matic: 'https://rpc-mainnet.maticvigil.com'
      },
      default: {
        local: 'direct'
      }
    }
  },
  networks: {
    ethereum: {
      1: {
        id: 1,
        type: 'ethereum',
        symbol: 'ETH',
        name: 'Mainnet',
        explorer: 'https://etherscan.io',
        gas: {
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
        connection: {
          primary: {
            on: true,
            current: 'infura',
            status: 'connected',
            connected: true,
            type: '',
            network: '1',
            custom: ''
          },
          secondary: {
            on: false,
            current: 'custom',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          }
        }
      },
      3: {
        id: 3,
        type: 'ethereum',
        symbol: 'ETH',
        name: 'Ropsten',
        explorer: 'https://ropsten.etherscan.io',
        gas: {
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
        connection: {
          primary: {
            on: true,
            current: 'infura',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          },
          secondary: {
            on: false,
            current: 'custom',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          }
        }
      },
      4: {
        id: 4,
        type: 'ethereum',
        symbol: 'ETH',
        name: 'Rinkeby',
        explorer: 'https://rinkeby.etherscan.io',
        gas: {
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
        connection: {
          primary: {
            on: true,
            current: 'infura',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          },
          secondary: {
            on: false,
            current: 'custom',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          }
        }
      },
      5: {
        id: 5,
        type: 'ethereum',
        symbol: 'ETH',
        name: 'Görli',
        explorer: 'https://goerli.etherscan.io',
        gas: {
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
        connection: {
          primary: {
            on: true,
            current: 'prylabs',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          },
          secondary: {
            on: false,
            current: 'custom',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          }
        }
      },
      42: {
        id: 42,
        type: 'ethereum',
        symbol: 'ETH',
        name: 'Kovan',
        explorer: 'https://kovan.etherscan.io',
        gas: {
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
        connection: {
          primary: {
            on: true,
            current: 'infura',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          },
          secondary: {
            on: false,
            current: 'custom',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          }
        }
      },
      74: {
        id: 74,
        type: 'ethereum',
        symbol: 'EIDI',
        name: 'IDChain',
        explorer: 'https://explorer.idchain.one',
        gas: {
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
        connection: {
          primary: {
            on: true,
            current: 'idchain',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          },
          secondary: {
            on: false,
            current: 'custom',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          }
        }
      },
      100: {
        id: 100,
        type: 'ethereum',
        symbol: 'xDAI',
        name: 'xDai',
        explorer: 'https://blockscout.com/poa/xdai',
        gas: {
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
        connection: {
          primary: {
            on: true,
            current: 'poa',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          },
          secondary: {
            on: false,
            current: 'custom',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          }
        }
      },
      137: {
        id: 137,
        type: 'ethereum',
        symbol: 'MATIC',
        name: 'Polygon',
        explorer: 'https://explorer.matic.network',
        gas: {
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
        connection: {
          primary: {
            on: true,
            current: 'matic',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          },
          secondary: {
            on: false,
            current: 'custom',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: ''
          }
        }
      }
    }
  }
}

const output = {
  main: {
    _version: 41,
    instanceId: '35152a4b-e6e4-415f-931a-91cc0a90cddc',
    networks: {
      ethereum: {
        1: {
          id: 1,
          type: 'ethereum',
          name: 'Mainnet',
          on: true,
          connection: {
            primary: {
              on: true,
              connected: false,
              current: 'custom',
              status: 'connected',
              custom: ''
            },
            secondary: {
              on: false,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            }
          },
          layer: 'mainnet',
          isTestnet: false,
          explorer: 'https://etherscan.io'
        },
        3: {
          id: 3,
          type: 'ethereum',
          name: 'Ropsten',
          on: false,
          connection: {
            primary: {
              on: true,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            },
            secondary: {
              on: false,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            }
          },
          layer: 'testnet',
          isTestnet: true,
          explorer: 'https://ropsten.etherscan.io'
        },
        4: {
          id: 4,
          type: 'ethereum',
          name: 'Rinkeby',
          on: false,
          connection: {
            primary: {
              on: true,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            },
            secondary: {
              on: false,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            }
          },
          layer: 'testnet',
          isTestnet: true,
          explorer: 'https://rinkeby.etherscan.io'
        },
        5: {
          id: 5,
          type: 'ethereum',
          name: 'Görli',
          on: false,
          connection: {
            primary: {
              on: false,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            },
            secondary: {
              on: false,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            }
          },
          layer: 'testnet',
          isTestnet: true,
          explorer: 'https://goerli.etherscan.io'
        },
        10: {
          id: 10,
          type: 'ethereum',
          name: 'Optimism',
          on: false,
          connection: {
            primary: {
              on: true,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            },
            secondary: {
              on: false,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            }
          },
          layer: 'rollup',
          isTestnet: false,
          explorer: 'https://optimistic.etherscan.io'
        },
        42: {
          id: 42,
          type: 'ethereum',
          name: 'Kovan',
          on: false,
          connection: {
            primary: {
              on: true,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            },
            secondary: {
              on: false,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            }
          },
          layer: 'testnet',
          isTestnet: true,
          explorer: 'https://kovan.etherscan.io'
        },
        74: {
          id: 74,
          type: 'ethereum',
          name: 'IDChain',
          on: false,
          connection: {
            primary: {
              on: true,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            },
            secondary: {
              on: false,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            }
          },
          layer: 'other',
          isTestnet: false,
          explorer: 'https://explorer.idchain.one'
        },
        100: {
          id: 100,
          type: 'ethereum',
          name: 'xDai',
          on: false,
          connection: {
            primary: {
              on: true,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: 'https://rpc.gnosischain.com'
            },
            secondary: {
              on: false,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            }
          },
          layer: 'sidechain',
          isTestnet: false,
          explorer: 'https://blockscout.com/poa/xdai'
        },
        137: {
          id: 137,
          type: 'ethereum',
          name: 'Polygon',
          on: false,
          connection: {
            primary: {
              on: true,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            },
            secondary: {
              on: false,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            }
          },
          layer: 'sidechain',
          isTestnet: false,
          explorer: 'https://polygonscan.com'
        },
        8453: {
          id: 8453,
          type: 'ethereum',
          name: 'Base',
          on: false,
          connection: {
            primary: {
              on: true,
              connected: false,
              current: 'pylon',
              status: 'loading',
              custom: ''
            },
            secondary: {
              on: false,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            }
          },
          layer: 'rollup',
          isTestnet: false,
          explorer: 'https://basescan.org'
        },
        42161: {
          id: 42161,
          type: 'ethereum',
          name: 'Arbitrum',
          on: false,
          connection: {
            primary: {
              on: true,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            },
            secondary: {
              on: false,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            }
          },
          layer: 'rollup',
          isTestnet: false,
          explorer: 'https://explorer.arbitrum.io'
        },
        84531: {
          id: 84531,
          type: 'ethereum',
          name: 'Base Görli',
          on: false,
          connection: {
            primary: {
              on: true,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: 'https://goerli.base.org'
            },
            secondary: {
              on: false,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            }
          },
          layer: 'testnet',
          isTestnet: true,
          explorer: 'https://goerli-explorer.base.org'
        },
        11155111: {
          id: 11155111,
          type: 'ethereum',
          name: 'Sepolia',
          on: false,
          connection: {
            primary: {
              on: true,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            },
            secondary: {
              on: false,
              connected: false,
              current: 'custom',
              status: 'loading',
              custom: ''
            }
          },
          layer: 'testnet',
          isTestnet: true,
          explorer: 'https://sepolia.etherscan.io'
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
            icon: '',
            name: 'Ether',
            decimals: 18
          },
          icon: '',
          primaryColor: 'accent1'
        },
        3: {
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
            name: '',
            decimals: 18
          },
          icon: '',
          primaryColor: 'accent2'
        },
        4: {
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
            name: '',
            decimals: 18
          },
          icon: '',
          primaryColor: 'accent2'
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
        42: {
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
            name: '',
            decimals: 18
          },
          icon: '',
          primaryColor: 'accent2'
        },
        74: {
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
            symbol: 'EIDI',
            usd: {
              price: 0,
              change24hr: 0
            },
            icon: '',
            name: '',
            decimals: 18
          },
          icon: '',
          primaryColor: 'accent3'
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
          icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/baseiconcolor.png',
          primaryColor: 'accent8',
          nativeCurrency: {
            symbol: 'ETH',
            icon: '',
            name: 'Ether',
            decimals: 18,
            usd: {
              price: 0,
              change24hr: 0
            }
          }
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
          icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/icons/arbitrum.svg',
          primaryColor: 'accent7',
          nativeCurrency: {
            symbol: 'ETH',
            icon: '',
            name: 'Ether',
            decimals: 18,
            usd: {
              price: 0,
              change24hr: 0
            }
          }
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
          icon: 'https://frame.nyc3.cdn.digitaloceanspaces.com/baseiconcolor.png',
          primaryColor: 'accent2',
          nativeCurrency: {
            symbol: 'görETH',
            icon: '',
            name: 'Görli Ether',
            decimals: 18,
            usd: {
              price: 0,
              change24hr: 0
            }
          }
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
          icon: '',
          primaryColor: 'accent2',
          nativeCurrency: {
            symbol: 'sepETH',
            icon: '',
            name: 'Sepolia Ether',
            decimals: 18,
            usd: {
              price: 0,
              change24hr: 0
            }
          }
        }
      }
    },
    colorway: 'dark',
    mute: {
      alphaWarning: false,
      welcomeWarning: true,
      externalLinkWarning: false,
      explorerWarning: false,
      signerRelockChange: false,
      gasFeeWarning: false,
      betaDisclosure: false,
      onboardingWindow: false,
      migrateToPylon: false,
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
    launch: true,
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
    openDapps: [],
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
    },
    knownExtensions: {},
    permissions: {},
    accounts: {},
    accountsMeta: {},
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
    signers: {
      '3962313363386161636464323432666631363965386638393033343037656330': {
        id: '3962313363386161636464323432666631363965386638393033343037656330',
        type: 'ring',
        addresses: ['0xbad0fc6b8a20bee2daee7a1eeef448afb880cbf6'],
        status: 'locked',
        name: '',
        model: '',
        createdAt: 0
      }
    },
    updater: {
      dontRemind: []
    },
    privacy: {
      errorReporting: true
    }
  },
  windows: {
    panel: {
      showing: false,
      nav: [],
      footer: {
        height: 40
      }
    },
    dash: {
      showing: false,
      nav: [],
      footer: {
        height: 40
      }
    },
    frames: []
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
  keyboardLayout: {
    isUS: true
  },
  tray: {
    initial: true,
    open: false
  },
  platform: 'linux'
}

export { input, output }
