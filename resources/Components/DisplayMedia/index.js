import React from 'react'
import styled from 'styled-components'

import svg from '../../svg'

const pylonURL = (url) => {
  if (!url) return ''
  if (url.startsWith('https://static.pylon.link/')) return url
  return `https://proxy.pylon.link?type=icon&target=${encodeURIComponent(url)}`
}

const DisplayBox = styled.div`
  img {
  }
  video {
  }
`

const DisplayMedia = ({ media, thumb, frozen }) => {
  if (!media) return null
  if (media.format === 'image') {
    if (thumb) {
      if (frozen) {
        if (media.cdn.frozen) {
          return <img src={pylonURL(media.cdn.frozen)} />
        } else {
          return svg.missing(12)
        }
      } else {
        if (media.cdn.thumb) {
          return <img src={pylonURL(media.cdn.thumb || media.cdn.main || media.source)} />
        } else {
          return svg.missing(12)
        }
      }
    } else {
      return (
        <DisplayBox>
          <img src={pylonURL(media.cdn.main || media.source)} />
        </DisplayBox>
      )
    }
  } else if (media.type === 'video') {
    if (thumb) {
      return (
        <DisplayBox>
          {frozen ? (
            <video pause={true} src={pylonURL(media.cdn.thumb)} />
          ) : (
            <video src={pylonURL(media.cdn.thumb || media.cdn.main || media.source)} />
          )}
        </DisplayBox>
      )
    } else {
      return (
        <DisplayBox>
          <video src={pylonURL(media.cdn.main || media.source)} />
        </DisplayBox>
      )
    }
  }
}

export default DisplayMedia
