import React, { useRef, useEffect, useState } from 'react'
import DOMPurify from 'dompurify'

import svg from '../../svg'

import DynamicImg from '../DynamicImg'

const Icon = ({ svgName, alt = '', svgSize = 16, img, small, nft, active }) => {
  if (img) {
    return (
      <DynamicImg
        src={img}
        // src={`https://proxy.pylon.link?type=icon&target=${encodeURIComponent(img)}`}
        alt={alt}
        active={active}
      />
    )
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

  if (nft) return <div style={{ position: 'relative', top: '-1px' }}>{svg.inventory(13)}</div>

  return svg.eth(small ? 13 : 18)
}

const RingIcon = ({ color, svgName, svgSize, img, small, block, noRing, alt, nft, active }) => {
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
          active={active}
        />
      </div>
    </div>
  )
}

export default RingIcon
