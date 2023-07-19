import React, { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'

import svg from '../../svg'

const pylonURL = (url) => {
  if (!url) return ''
  if (url.startsWith('https://static.pylon.link/')) return url
  return `https://proxy.pylon.link?type=icon&target=${encodeURIComponent(url)}`
}

const DisplayBox = styled.div`
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.3s ease-in-out;
  z-index: 3;
  img,
  video {
    width: ${({ full }) => (full ? 'auto' : '100%')};
    height: ${({ full }) => (full ? 'auto' : '100%')};
    max-width: 100%;
    max-height: 100%;
    object-fit: ${({ full }) => (full ? 'contain' : 'cover')};
    border-radius: 12px;
    position: relative;
  }

  img:before {
    content: attr(alt);
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--ghostA);
    color: var(--outerspace);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 17px;
    font-weight: 300;
    letter-spacing: -0.5px;
    margin-left: -0.5px;
    font-family: 'VCR';
  }
`

const pulse = keyframes`
  0% { 
    transform: scale(0); 
    opacity: 1; 
  }
  100% { 
    transform: scale(1); 
    opacity: 0;
  }
`

const MediaLoadingAnimation = styled.div`
  border: 4px solid var(--outerspace);
  border-radius: 50%;
  width: 64px;
  height: 64px;
  animation: ${pulse} 1.6s ease-out infinite;
  opacity: 0;
`

const SVGWrap = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`

const MediaLoading = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`

const MainMedia = ({ full, media, loading, muted }) => {
  const [mediaLoaded, setMediaLoaded] = useState(false)

  const mainUrl = pylonURL(media.cdn?.main || media.source)
  const thumbUrl = pylonURL(media.cdn?.thumb || media.source)

  useEffect(() => {
    setMediaLoaded(false)
    if (media.format === 'video') {
      const video = document.createElement('video')
      video.src = mainUrl
      video.onloadeddata = () => setMediaLoaded(true)
    } else {
      const img = new Image()
      img.src = mainUrl
      img.onload = () => setMediaLoaded(true)
    }
  }, [media.cdn, media.source])

  if (media.format === 'video') {
    return (
      <React.Fragment key={'video'}>
        {!mediaLoaded && (
          <MediaLoading>
            <MediaLoadingAnimation />
          </MediaLoading>
        )}
        <DisplayBox full={full} style={mediaLoaded ? { opacity: 1, zIndex: 3 } : { opacity: 0, zIndex: 3 }}>
          <video autoPlay loop muted={muted} src={mainUrl} loading={loading} />
        </DisplayBox>
        <DisplayBox
          style={{
            position: 'absolute',
            top: '-20%',
            left: '-20%',
            height: '140%',
            width: '140%',
            filter: 'blur(32px)',
            opacity: 0.6,
            zIndex: 1
          }}
        >
          <video autoPlay loop muted={true} src={thumbUrl} loading={loading} />
        </DisplayBox>
      </React.Fragment>
    )
  } else {
    return (
      <React.Fragment key={'image'}>
        {!mediaLoaded && (
          <MediaLoading>
            <MediaLoadingAnimation />
          </MediaLoading>
        )}
        <DisplayBox full={full} style={mediaLoaded ? { opacity: 1 } : { opacity: 0 }}>
          <img src={mainUrl} loading={loading} />
        </DisplayBox>
        <DisplayBox
          key={thumbUrl}
          style={{
            position: 'absolute',
            top: '-20%',
            left: `-20%`,
            height: '140%',
            width: '140%',
            filter: 'blur(32px)',
            opacity: 0.3,
            zIndex: 1
          }}
        >
          <img src={thumbUrl} loading={loading} />
        </DisplayBox>
      </React.Fragment>
    )
  }
}

const DisplayMedia = ({ media, alt, thumb, frozen, audio, full, lazy }) => {
  console.log('display media', media)
  if (!media || !media.source || !media.format) {
    return <SVGWrap>{svg.missing(thumb || frozen ? 10 : 20)}</SVGWrap>
  }
  if (media.format === 'image') {
    if (thumb || frozen) {
      if (frozen) {
        const frozenUrl = pylonURL(media.cdn?.frozen)
        if (frozenUrl) {
          return <img key={alt} src={frozenUrl} alt={alt} loading={lazy ? 'lazy' : 'eager'} />
        } else {
          return <SVGWrap>{svg.missing(10)}</SVGWrap>
        }
      } else {
        const thumbUrl = pylonURL(media.cdn?.thumb || media.cdn?.main || media.source)
        if (thumbUrl) {
          return <img key={alt} src={thumbUrl} loading={lazy ? 'lazy' : 'eager'} />
        } else {
          return <SVGWrap>{svg.missing(10)}</SVGWrap>
        }
      }
    } else {
      return <MainMedia full={full} media={media} loading={lazy ? 'lazy' : 'eager'} />
    }
  } else if (media.format === 'video') {
    if (thumb || frozen) {
      const thumbUrl = pylonURL(media.cdn?.thumb || media.cdn?.main || media.source)
      return (
        <DisplayBox full={full}>
          {frozen ? (
            <video loop muted src={thumbUrl} loading={lazy ? 'lazy' : 'eager'} />
          ) : (
            <video autoPlay loop muted={!audio} src={thumbUrl} loading={lazy ? 'lazy' : 'eager'} />
          )}
        </DisplayBox>
      )
    } else {
      return <MainMedia full={full} muted={!audio} media={media} loading={lazy ? 'lazy' : 'eager'} />
    }
  }
}

export default DisplayMedia
