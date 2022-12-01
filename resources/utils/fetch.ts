import fetch, { RequestInit } from 'node-fetch'

import type { AbortSignal } from 'node-fetch/externals'

export async function fetchWithTimeout(url: string, options: RequestInit, timeout: number) {
  const controller = new AbortController()

  setTimeout(() => controller.abort(), timeout)

  return fetch(url, { ...options, signal: controller.signal as AbortSignal })
}
