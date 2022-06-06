import arbitrum from './icons/arbitrum.svg'
import eth from './icons/eth.svg'
import fantom from './icons/fantom.svg'
import optimism from './icons/optimism.svg'
import polygon from './icons/polygon.svg'
import xdai from './icons/xdai.svg'

export default {
  '0x1': {
    chainId: 1,
    name: 'mainnet',
    icon: '',
    primaryColor: 'var(--good)'
  },
  '0xa': {
    chainId: 10,
    name: 'optimism',
    icon: optimism,
    primaryColor: 'rgb(246, 36, 35)'
  },
  '0x64': {
    chainId: 100,
    name: 'xdai',
    icon: xdai,
    primaryColor: 'rgb(90, 181, 178)'
  },
  '0x89': {
    chainId: 137,
    name: 'polygon',
    icon: polygon,
    primaryColor: 'rgb(140, 97, 232)'
  },
  '0xfa': {
    chainId: 250,
    name: 'fantom',
    icon: fantom,
    primaryColor: 'rgb(51, 103, 246)'
  },
  '0xa4b1': {
    chainId: 42161,
    name: 'arbitrum',
    icon: arbitrum,
    primaryColor: 'rgb(62, 173, 241)'
  }
}
