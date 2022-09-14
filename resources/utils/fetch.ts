import fetch, { RequestInit } from 'node-fetch'

export async function fetchWithTimeout (url: string, options: RequestInit, timeout: number) {  //@ts-ignore
  const signal = AbortSignal.timeout(timeout)
  return fetch(url, { ...options, signal })
}