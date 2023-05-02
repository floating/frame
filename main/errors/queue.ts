const queuedErrors: Error[] = []

export function queueError(err: Error) {
  queuedErrors.push(err)
}

export function getQueuedErrors() {
  return queuedErrors.reverse()
}
