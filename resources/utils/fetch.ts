import fetch, { RequestInit } from 'node-fetch'

export async function fetchWithTimeout (url: string, options: RequestInit, timeout: number) {  
  const controller = new AbortController() 
  setTimeout(() => controller.abort(), timeout)
  // @ts-ignore
  return fetch(url, { ...options, signal: controller.signal })
}
