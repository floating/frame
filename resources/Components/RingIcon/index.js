import React from 'react'

import svg from '../../svg'

import DisplayMedia from '../DisplayMedia'

const mediaExists = (media) => {
  return media?.source && media?.format
}

const Icon = ({ svgName, alt = '', svgSize = 16, img, small, nft, frozen, media, thumb }) => {
  if (mediaExists(media)) {
    return <DisplayMedia media={media} thumb={thumb} frozen={frozen} alt={alt} />
  }

  if (svgName) {
    const iconName = svgName.toLowerCase()
    const svgIcon = svg[iconName]
    return svgIcon ? svgIcon(svgSize) : null
  }

  if (nft) return <div style={{ position: 'relative', top: '-1px' }}>{svg.inventory(13)}</div>

  return svg.missing(small ? 8 : 12)
}

const RingIcon = ({ color, svgName, svgSize, img, small, block, noRing, alt, nft, frozen, media, thumb }) => {
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
          alt={alt}
          small={small}
          nft={nft}
          frozen={frozen}
          thumb={thumb}
          media={media}
        />
      </div>
    </div>
  )
}

export default RingIcon
