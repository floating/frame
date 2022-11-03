export function accountSort (accounts:Record<string, Account>, a:string, b:string) {
  try {
    let [aBlockStr, aLocalStr] = accounts[a].created.split(':')
    let [bBlockStr, bLocalStr] = accounts[b].created.split(':')

    const aLocal = parseInt(aLocalStr)
    const bLocal = parseInt(bLocalStr)

    if (aBlockStr === 'new' && bBlockStr !== 'new') return -1
    if (bBlockStr !== 'new' && aBlockStr === 'new') return 1
    if (aBlockStr === 'new' && bBlockStr === 'new') return aLocal >= bLocal ? -1: 1

    const aBlock = parseInt(aBlockStr)
    const bBlock = parseInt(bBlockStr)

    if (aBlock > bBlock) return -1
    if (aBlock < bBlock) return 1
    if (aBlock === bBlock) return aLocal >= bLocal ? -1 : 1

    return 0
  } catch (e) {
    console.error(e)
    return 0
  }
}
