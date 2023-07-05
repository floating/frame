// Adapted from https://github.com/drum-n-bass/heads

import React, { useCallback, useRef } from 'react'
import styled from 'styled-components'

import md5 from './md5'
import params from './params'

const DrawAvatar = styled.canvas`
  width: 8px;
  height: 8px;
`

const AvatarWrap = styled.div`
  height: 100%;
  width: 100%;

  canvas {
    width: 100%;
    height: 100%;
    background: transparent;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
  }
`
const processParam = (param, value) => param.min + (value % (param.max - param.min))

const hex2dec = (hex) => parseInt(hex, 16)

const pick = (seed, pos, length = 3) => hex2dec(seed.substring(pos, pos + length))

const drawPixel = (ctx, x, y, color, seed) => {
  let rnd1 = pick(seed, 1)
  let rnd2 = pick(seed, 2)
  let variation = (x + rnd1 + y + rnd2) * color.variation
  let hsl = `hsl(${color.hue + variation},${color.saturation}%, ${color.lightness}%)`

  ctx.beginPath()
  ctx.rect(x, y, 1, 1)
  ctx.fillStyle = hsl
  ctx.fill()
  ctx.closePath()
}

const drawLayer = (ctx, data, color, seed) => {
  const rows = data.split(',')
  rows.forEach((row, r) => {
    const pixels = row.split('', 8)
    pixels.forEach((pixel, p) => {
      if (pixel == 1) {
        drawPixel(ctx, p, r, color, seed)
      }
    })
  })
  return ctx
}

const AccountAvatar = ({ address }) => {
  const drawCanvas = useCallback(
    (canvas) => {
      if (!canvas) return
      const seed = md5(address)
      console.log('seed', seed)
      const data = {
        address: address,
        seed: seed,
        colors: {
          skin: {
            hue: processParam(params.colors.skin.hue, pick(seed, 0)),
            saturation: processParam(params.colors.skin.saturation, pick(seed, 1)),
            lightness: processParam(params.colors.skin.lightness, pick(seed, 2)),
            variation: processParam(params.colors.skin.variation, pick(seed, 3))
          },
          hair: {
            hue: processParam(params.colors.hair.hue, pick(seed, 1)),
            saturation: processParam(params.colors.hair.saturation, pick(seed, 2)),
            lightness: processParam(params.colors.hair.lightness, pick(seed, 3)),
            variation: processParam(params.colors.hair.variation, pick(seed, 4))
          },
          eyes: {
            hue: processParam(params.colors.eyes.hue, pick(seed, 2)),
            saturation: processParam(params.colors.eyes.saturation, pick(seed, 3)),
            lightness: processParam(params.colors.eyes.lightness, pick(seed, 4)),
            variation: processParam(params.colors.eyes.variation, pick(seed, 5))
          },
          pupils: {
            hue: processParam(params.colors.pupils.hue, pick(seed, 3)),
            saturation: processParam(params.colors.pupils.saturation, pick(seed, 4)),
            lightness: processParam(params.colors.pupils.lightness, pick(seed, 5)),
            variation: processParam(params.colors.pupils.variation, pick(seed, 6))
          }
        },
        layers: {
          skin: processParam({ min: 0, max: params.layers.skins.length }, pick(seed, 1)),
          hairstyle: processParam({ min: 0, max: params.layers.hairstyles.length }, pick(seed, 2)),
          eyes: processParam({ min: 0, max: params.layers.eyes.length }, pick(seed, 3)),
          pupils: processParam({ min: 0, max: params.layers.pupils.length }, pick(seed, 4))
        }
      }

      const ctx = canvas.getContext('2d')
      ctx.canvas.width = 8
      ctx.canvas.height = 8

      drawLayer(ctx, params.layers.skins[data.layers.skin], data.colors.skin, seed)
      drawLayer(ctx, params.layers.eyes[data.layers.eyes], data.colors.eyes, seed)
      drawLayer(ctx, params.layers.hairstyles[data.layers.hairstyle], data.colors.hair, seed)
      drawLayer(ctx, params.layers.pupils[data.layers.pupils], data.colors.pupils, seed)
    },
    [address]
  )

  return (
    <AvatarWrap>
      <DrawAvatar ref={(canvas) => drawCanvas(canvas)} />
    </AvatarWrap>
  )
}

export default AccountAvatar
