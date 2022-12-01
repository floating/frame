export const isCancelableRequest = (status: string): Boolean => {
  return !['sent', 'sending', 'verifying', 'confirming', 'confirmed', 'error', 'declined'].includes(status)
}
