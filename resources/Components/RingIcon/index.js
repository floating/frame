import React, { useRef, useEffect, useState } from 'react'
import DOMPurify from 'dompurify'

import svg from '../../svg'

const sanitizeURL = (url) => DOMPurify.sanitize(url)
const DynamicIcon = ({ src, alt, active }) => {
  const canvasRef = useRef()
  const [canvasUrl, setCanvasUrl] = useState(null)
  const [originalUrl, setOriginalUrl] = useState('')

  const sanitizeURL = (url) => {
    const sanitized = DOMPurify.sanitize(url)
    setOriginalUrl(sanitized)
    return sanitized
  }

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = sanitizeURL(src)

    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')

      const scaleFactor = window.devicePixelRatio || 1
      const width = img.width * scaleFactor
      const height = img.height * scaleFactor

      canvas.width = width
      canvas.height = height
      ctx.scale(scaleFactor, scaleFactor)

      ctx.drawImage(img, 0, 0, width / scaleFactor, height / scaleFactor)

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        setCanvasUrl(url)
      })
    }
  }, [src])

  if (!canvasUrl) {
    return <canvas ref={canvasRef} alt={alt} />
  } else if (active) {
    return <img src={originalUrl} alt={alt} />
  } else {
    return <img src={canvasUrl} alt={alt} />
  }
}

const Icon = ({ svgName, alt = '', svgSize = 16, img, small, nft, active }) => {
  if (img) {
    const sanitizedImg = sanitizeURL(img)
    return (
      <DynamicIcon
        src={`https://proxy.pylon.link?type=icon&target=${encodeURIComponent(sanitizedImg)}`}
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
