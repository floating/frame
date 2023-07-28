export enum ApprovalType {
  OtherChainApproval = 'approveOtherChain',
  GasLimitApproval = 'approveGasLimit'
}

const NETWORK_PRESETS = {
  ethereum: {
    default: {
      local: 'direct'
    },
    1: {
      pylon: 'wss://evm.pylon.link/mainnet'
    },
    5: {
      pylon: 'wss://evm.pylon.link/goerli'
    },
    10: {
      pylon: 'wss://evm.pylon.link/optimism'
    },
    137: {
      pylon: 'wss://evm.pylon.link/polygon'
    },
    8453: {
      pylon: 'https://evm.pylon.link/base-mainnet'
    },
    42161: {
      pylon: 'wss://evm.pylon.link/arbitrum'
    },
    84531: {
      pylon: 'wss://evm.pylon.link/base-goerli'
    },
    11155111: {
      pylon: 'wss://evm.pylon.link/sepolia'
    }
  }
}

const ADDRESS_DISPLAY_CHARS = 8
const NATIVE_CURRENCY = '0x0000000000000000000000000000000000000000'
const MAX_HEX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

export { NETWORK_PRESETS, ADDRESS_DISPLAY_CHARS, NATIVE_CURRENCY, MAX_HEX }
