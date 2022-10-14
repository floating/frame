import log from 'electron-log'
import https from 'https'
import semver from 'semver'

import type { VersionUpdate } from '.'

import packageInfo from '../../package.json'

const repo = packageInfo.repository.split(':')[1]
const version = packageInfo.version

const httpOptions = {
  host: 'api.github.com',
  path: `/repos/${repo}/releases`,
  headers: { 'User-Agent': 'request' }
}

interface GithubRelease {
  prerelease: boolean,
  tag_name: string,
  html_url: string
}

interface CheckOptions {
  prereleaseTrack?: boolean
}

function parseResponse (rawData: string) {
  try {
    return JSON.parse(rawData) as GithubRelease[]
  } catch (e) {
    log.warn('Manual check for update returned invalid JSON response', e)
    return []
  }
}

function compareVersions (a: string, b: string) {
  if (semver.gt(a, b)) return 1
  if (semver.lt(a, b)) return -1
  return 0
}

export default function (opts?: CheckOptions) {
  log.verbose('Performing manual check for updates', { prereleaseTrack: opts?.prereleaseTrack })

  return new Promise<VersionUpdate | undefined>((resolve, reject) => {
    https.get(httpOptions, res => {
      let rawData = ''
    
      res.on('error', e => {
        log.warn('Manual check for update encountered HTTP error', e)
        reject(e)
      })

      res.on('data', chunk => { rawData += chunk })
      res.on('end', () => {
        const contentType = res.headers['content-type'] || ''

        log.debug('Manual check response', { status: res.statusCode, contentType })
        if (res.statusCode != 200 || !contentType.includes('json')) {
          log.warn('Manual check for update returned invalid response', { status: res.statusCode, contentType, data: rawData })
          return reject(new Error(`invalid response, status: ${res.statusCode} contentType: ${contentType}`))
        }

        const releases = parseResponse(rawData).filter(r => (!r.prerelease || opts?.prereleaseTrack)) || []
        const latestRelease = releases[0] || { tag_name: '' }
    
        if (latestRelease.tag_name) {
          const latestVersion = latestRelease.tag_name.charAt(0) === 'v' ? latestRelease.tag_name.substring(1) : latestRelease.tag_name
          const isNewerVersion = compareVersions(latestVersion, version) === 1
    
          log.verbose('Manual check found release', { currentVersion: version, latestVersion, isNewerVersion })
    
          resolve(isNewerVersion
            ? { version: latestRelease.tag_name, location: latestRelease.html_url }
            : undefined
          )
        } else {
          log.verbose('Manual check did not find any releases')
          reject(new Error('no releases found'))
        }
      })
    }).on('error', reject)
  })
}
