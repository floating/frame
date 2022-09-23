import arbitrum from './icons/arbitrum.svg'
import fantom from './icons/fantom.svg'
import optimism from './icons/optimism.svg'
import polygon from './icons/polygon.svg'
import xdai from './icons/xdai.svg'

const icons = {
  arbitrum, 
  fantom,
  optimism,
  polygon,
  xdai  
}

export default (chainName = '') => {
  if (!chainName) {
    return ''
  }
  
  return icons[chainName as keyof typeof icons] || ''
}
