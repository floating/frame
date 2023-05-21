import React, { useState } from 'react'
import styled from 'styled-components'

import link from '../../../../../resources/link'
// import svg from '../../../../../resources/svg'
// import { matchFilter } from '../../../../../resources/utils'

import RingIcon from '../../../../../resources/Components/RingIcon'

import useStore from '../../../../../resources/Hooks/useStore'
import { ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'
// import { DisplayFiatPrice, DisplayValue } from '../../../../../resources/Components/DisplayValue'
import RingIcon from '../../../../../resources/Components/RingIcon'

import useStore from '../../../../../resources/Hooks/useStore'

import React, { useRef, useEffect, useState } from 'react'
import DOMPurify from 'dompurify'

const DynamicImg = ({ src, alt, active }) => {
  const canvasRef = useRef()
  const [canvasUrl, setCanvasUrl] = useState('')
  const [originalUrl, setOriginalUrl] = useState('')

  const sanitizeURL = (url) => {
    const sanitized = DOMPurify.sanitize(url)
    setOriginalUrl(sanitized)
    return sanitized
  }

  useEffect(() => {
    if (!src) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = sanitizeURL(src)

    const clone = () => {
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
        console.log('blob url for img', url)
        setCanvasUrl(url)
      })
    }

    if (img.complete) {
      setTimeout(() => {
        clone()
      }, 0)
    } else {
      img.onload = () => {
        clone()
      }
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

const CollectionInner = styled.div`
  position: relative;
  height: 65px;
  transition: all linear 0.8s;
`

const CollectionIcon = styled.div`
  position: absolute;
  top: 13px;
  left: 14px;
`

const CollectionMain = styled.div`
  position: absolute;
  display: flex;
  justify-content: space-between;
  inset: 32px 20px 16px 66px;
`

const CollectionLine = styled.div`
  background: var(--ghostY);
  height: 1px;
  margin: 11px 12px 0px 4px;
  flex: 1;
  position: relative;
`

const CollectionDots = styled.div`
  display: flex;
  height: 100%;
`

const CollectionDot = styled.div`
  display: flex;
  height: 20px;
  width: 20px;
  min-height: 20px;
  min-width: 20px;
  margin-right: 8px;
  border-radius: 8px;
  background-image: ${(props) => `url(${props.bg})`};
  background-size: cover;
  background-color: var(--ghostB);
  overflow: hidden;
  img {
    margin: -1px;
    object-fit: cover;
  }
`

const CollectionCount = styled.div`
  display: flex;
  height: 20px;
  min-height: 20px;
  margin-top: 1px;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  font-family: 'FiraCode';
  padding-left: 4px;
`

const Collection = ({ moduleId, account, collection, collectionId }) => {
  const scanning = false
  const chain = useStore('main.networks.ethereum', collection.meta.chainId)
  const chainColor = useStore('main.networksMeta.ethereum', collection.meta.chainId, 'primaryColor')

  const [active, setActive] = useState(false)

  const previewItems = Object.keys(collection.items || {})
    .sort((a, b) => {
      a = collection.items[a].tokenId
      b = collection.items[b].tokenId
      return a < b ? -1 : b > a ? 1 : 0
    })
    .slice(0, 5)
  return (
    <ClusterRow key={collectionId}>
      <ClusterValue
        onMouseOver={() => {
          setActive(true)
        }}
        onMouseLeave={() => {
          setActive(false)
        }}
        onClick={() => {
          const crumb = {
            view: 'expandedModule',
            data: {
              id: moduleId,
              account: account,
              currentCollection: collectionId
            }
          }
          link.send('nav:forward', 'panel', crumb)
        }}
      >
        <div className={'signerBalance'} onMouseDown={() => this.setState({ selected: i })}>
          {scanning && <div className='signerBalanceLoading' style={{ animationDelay: 0.15 * i + 's' }} />}
          <CollectionInner>
            <CollectionIcon>
              <RingIcon
                img={collection.meta.image}
                alt={collection.meta.name}
                color={chainColor ? `var(--${chainColor})` : ''}
                nft={true}
                active={active}
              />
            </CollectionIcon>
            <CollectionMain>
              <CollectionDots style={{ width: previewItems.length * 28 + 'px' }}>
                {previewItems.map((id) => {
                  const item = collection.items[id]
                  return (
                    <CollectionDot>
                      <DynamicImg src={item.img} alt={item.name} active={active} />
                    </CollectionDot>
                  )
                })}
              </CollectionDots>
              <CollectionLine />
              <CollectionCount>{Object.keys(collection.items).length}</CollectionCount>
            </CollectionMain>
            <div className='signerBalanceChain'>
              <span style={{ color: chainColor ? `var(--${chainColor})` : '' }}>{chain.name}</span>
              <span>{collection.meta.name}</span>
            </div>
          </CollectionInner>
        </div>
      </ClusterValue>
    </ClusterRow>
  )
}

const CollectionList = ({ moduleId, account, collections = [] }) => {
  const inventory = useStore('main.inventory', account)
  return collections.map((k) => {
    const collection = inventory[k]
    return <Collection moduleId={moduleId} account={account} collection={collection} collectionId={k} />
  })
}

export default CollectionList
