import React from 'react'

import svg from '../../svg'

const Icon = ({ svgName, alt = '', svgSize = 16, img, small, nft, active, imgFrozen }) => {
  console.log('active', active)
  if (imgFrozen && !active) {
    console.log('showing frozen image', imgFrozen)
    return <img src={imgFrozen} alt={alt} />
  } else if (img) {
    console.log('showing non-frozen image', img)
    return <img src={img} alt={alt} />
  }

  if (svgName) {
    const iconName = svgName.toLowerCase()
    const svgIcon = svg[iconName]
    return svgIcon ? svgIcon(svgSize) : null
  }

  if (nft) return <div style={{ position: 'relative', top: '-1px' }}>{svg.inventory(13)}</div>

  return svg.missing(small ? 8 : 12)
}

const RingIcon = ({ color, svgName, svgSize, img, small, block, noRing, alt, nft, active, imgFrozen }) => {
  let ringIconClass = 'ringIcon'
  if (small) ringIconClass += ' ringIconSmall'
  if (block) ringIconClass += ' ringIconBlock'
  if (noRing) ringIconClass += ' ringIconNoRing'
  if (nft) ringIconClass += ' ringIconNFT'
  return (
    <div
      className={ringIconClass}
      style={{
        borderColor: color
      }}
    >
      <div className='ringIconInner' style={block || nft ? { color } : { background: color }}>
        <Icon
          svgName={svgName}
          svgSize={svgSize}
          img={img}
          imgFrozen={imgFrozen}
          alt={alt}
          small={small}
          nft={nft}
          active={active}
        />
      </div>
    </div>
  )
}

export default RingIcon
