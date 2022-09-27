import React from 'react'
import Restore from 'react-restore'
import svg from '../../../resources/svg'

const Icon = ({ svgName, svgSize, img, small }) => {
  if (svgName) {
    const iconName = svgName.toLowerCase()
    const ethChains = ['mainnet', 'görli', 'sepolia', 'ropsten', 'rinkeby', 'kovan']
    if (ethChains.includes(iconName)) {
      return svg.eth(small ? 13 : 18)
    }
    // will be moved when we have a way for users to define custom icons
    const defaultChains = ['arbitrum', 'polygon', 'fantom', 'gnosis', 'optimism']
    if (defaultChains.includes(iconName)) {
      return <img src={`https://frame.nyc3.cdn.digitaloceanspaces.com/icons/${iconName}.svg`} />
    }
    const svgIcon = svg[iconName]
    return svgIcon ? svgIcon(svgSize) : null
  }
  if (img) {
    return <img src={img} />
  }
  return svg.eth(small ? 13 : 18)
}

class RingIcon extends React.Component {
  constructor (...args) {
    super(...args)
    this.state = {}
  }

  render () {
    const { color, svgLookup, img, small } = this.props
    return (
      <div 
        className={small ? 'ringIcon ringIconSmall' : 'ringIcon'}
        style={{
          borderColor: color
        }}
      >
        <div className='ringIconInner' style={{ background: color }}>
          <Icon svgName={svgLookup.name} svgSize={svgLookup.size} img={img} small={small} />
        </div>
      </div>
    )
  }
}

export default Restore.connect(RingIcon)
