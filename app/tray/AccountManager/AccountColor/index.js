const hash = async (input) => {
  const msgUint8 = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray
}

const bytesToInteger = (bytes) => {
  return bytes.reduce((total, byte, i) => total + byte * 2 ** (8 * i), 0)
}

const hsvToRgb = (h, s, v) => {
  let r, g, b, i, f, p, q, t
  i = Math.floor(h * 6)
  f = h * 6 - i
  p = v * (1 - s)
  q = v * (1 - f * s)
  t = v * (1 - (1 - f) * s)
  const assign = (vals) => {
    return (r = vals[0]), (g = vals[1]), (b = vals[2])
  }
  switch (i % 6) {
    case 0:
      assign([v, t, p])
      break
    case 1:
      assign([q, v, p])
      break
    case 2:
      assign([p, v, t])
      break
    case 3:
      assign([p, q, v])
      break
    case 4:
      assign([t, p, v])
      break
    case 5:
      assign([v, p, q])
      break
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

const ethAddressToColor = async (address) => {
  const hashArray = await hash(address)
  const intValue = bytesToInteger(hashArray)
  const hue = intValue % 360
  const sat = ((intValue / 2 ** 32) % 100) / 100
  const val = 1 - sat / 2
  const rgb = hsvToRgb(hue / 360, sat, val)
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}

export default ethAddressToColor
