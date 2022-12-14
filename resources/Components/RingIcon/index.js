import React from 'react'
import Restore from 'react-restore'
import svg from '../../../resources/svg'

const Icon = ({ svgName, svgSize = 16, img, small }) => {
  if (img) {
    return <img src={`https://proxy.pylon.link?type=icon&target=${encodeURIComponent(img)}`} />
  }
  if (svgName) {
    const iconName = svgName.toLowerCase()
    const ethChains = ['mainnet', 'görli', 'sepolia', 'ropsten', 'rinkeby', 'kovan']
    if (ethChains.includes(iconName)) {
      return svg.eth(small ? 13 : 18)
    }

    const svgIcon = svg[iconName]
    return svgIcon ? svgIcon(svgSize) : null
  }

  return svg.eth(small ? 13 : 18)
}

class RingIcon extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {}
  }

  render() {
    const { color, svgName, svgSize, img, small, block } = this.props
    let ringIconClass = 'ringIcon'
    if (small) ringIconClass += ' ringIconSmall'
    if (block) ringIconClass += ' ringIconBlock'
    return (
      <div
        className={ringIconClass}
        style={{
          borderColor: color
        }}
      >
        <div className='ringIconInner' style={block ? { color } : { background: color }}>
          <Icon svgName={svgName} svgSize={svgSize} img={img} small={small} />
        </div>
      </div>
    )
  }
}

export default Restore.connect(RingIcon)
