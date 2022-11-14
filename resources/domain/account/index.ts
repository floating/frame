export function accountSort (a: Account, b:Account) {
  try {
    const [aBlockStr, aLocalStr] = a.created.split(':')
    const [bBlockStr, bLocalStr] = b.created.split(':')

    const aLocal = parseInt(aLocalStr)
    const bLocal = parseInt(bLocalStr)

    if (aBlockStr === 'new' && bBlockStr !== 'new') return -1
    if (bBlockStr !== 'new' && aBlockStr === 'new') return 1
    if (aBlockStr === 'new' && bBlockStr === 'new') return bLocal - aLocal

    const aBlock = parseInt(aBlockStr)
    const bBlock = parseInt(bBlockStr)

    return bBlock-aBlock
  } catch (e) {
    console.error(e)
    return 0
  }
}
