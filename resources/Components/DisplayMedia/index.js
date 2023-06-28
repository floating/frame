import React from 'react'
import styled from 'styled-components'

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

const DisplayMedia = ({ media, alt, thumb, frozen, audio, full, lazy }) => {
  if (!media) return null
  if (media.format === 'image') {
    if (thumb || frozen) {
      if (frozen) {
        if (media.cdn?.frozen) {
          return (
            <img key={alt} src={pylonURL(media.cdn.frozen)} alt={alt} loading={lazy ? 'lazy' : 'eager'} />
          )
        } else {
          return svg.missing(12)
        }
      } else {
        if (media.cdn?.thumb) {
          return (
            <img
              key={alt}
              src={pylonURL(media.cdn.thumb || media.cdn.main || media.source)}
              loading={lazy ? 'lazy' : 'eager'}
            />
          )
        } else {
          return svg.missing(12)
        }
      }
    } else {
      return (
        <DisplayBox full={full}>
          <img src={pylonURL(media.cdn?.main || media.source)} loading={lazy ? 'lazy' : 'eager'} />
        </DisplayBox>
      )
    }
  } else if (media.format === 'video') {
    if (thumb || frozen) {
      return (
        <DisplayBox full={full}>
          {frozen ? (
            <video loop muted src={pylonURL(media.cdn?.thumb)} loading={lazy ? 'lazy' : 'eager'} />
          ) : (
            <video
              autoPlay
              loop
              muted={!audio}
              src={pylonURL(media.cdn?.thumb || media.cdn?.main || media.source)}
              loading={lazy ? 'lazy' : 'eager'}
            />
          )}
        </DisplayBox>
      )
    } else {
      return (
        <DisplayBox full={full}>
          <video
            autoPlay
            loop
            muted={!audio}
            src={pylonURL(media.cdn?.main || media.source)}
            loading={lazy ? 'lazy' : 'eager'}
          />
        </DisplayBox>
      )
    }
  }
}

export default DisplayMedia
