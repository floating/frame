import { padToEven } from 'ethereumjs-util'

type Color = { r: number, g: number, b: number }

export type ColorwayPalette = {
  accent1: Color
  accent2: Color
  accent3: Color
  accent4: Color
  accent5: Color
  accent6: Color
  accent7: Color
  accent8: Color
}

const light: ColorwayPalette = {
  accent1: { r: 0, g: 210, b: 190 },
  accent2: { r: 255, g: 153, b: 51 },
  accent3: { r: 255, g: 0, b: 174 },
  accent4: { r: 246, g: 36, b: 35 },
  accent5: { r: 90, g: 181, b: 178 },
  accent6: { r: 140, g: 97, b: 232 },
  accent7: { r: 62, g: 173, b: 241 },
  accent8: { r: 60, g: 40, b: 234 }
}

const dark: ColorwayPalette = {
  accent1: { r: 0, g: 210, b: 190 },
  accent2: { r: 255, g: 153, b: 51 },
  accent3: { r: 255, g: 0, b: 174 },
  accent4: { r: 246, g: 36, b: 35 },
  accent5: { r: 90, g: 181, b: 178 },
  accent6: { r: 140, g: 97, b: 232 },
  accent7: { r: 62, g: 173, b: 241 },
  accent8: { r: 60, g: 40, b: 234 }
}

const colorways: Record<Colorway, ColorwayPalette> = { light, dark }

function toHex (color: number) {
  return padToEven(color.toString(16))
}

export function getColor (key: keyof ColorwayPalette, colorway: Colorway) {
  const color = colorways[colorway][key]

  return { ...color, hex: `0x${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`}
}

export { light as LIGHT, dark as DARK }
