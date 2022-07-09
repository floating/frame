import log from 'electron-log'
import https from 'https'
import semver from 'semver'
import { VersionUpdate } from '.'

import packageInfo from '../../package.json'

const httpOptions = {
  host: 'api.github.com',
  path: '/repos/floating/frame/releases',
  headers: { 'User-Agent': 'request' }
}

const version = packageInfo.version

interface GithubRelease {
  prerelease: boolean,
  tag_name: string,
  html_url: string
}

interface CheckOptions {
  prereleaseTrack?: boolean
}

function parseResponse (rawData: string) {
  return JSON.parse(rawData) as GithubRelease[]
}

function compareVersions (a: string, b: string) {
  if (semver.gt(a, b)) return 1
  if (semver.lt(a, b)) return -1
  return 0
}

export default function (opts?: CheckOptions) {
  log.verbose('Performing manual check for updates', { prereleaseTrack: opts?.prereleaseTrack })

  return new Promise<VersionUpdate>((resolve, reject) => {
    https.get(httpOptions, res => {
      let rawData = ''
    
      res.on('error', reject)
      res.on('data', chunk => { rawData += chunk })
      res.on('end', () => {
        const releases = parseResponse(rawData).filter(r => (!r.prerelease || opts?.prereleaseTrack)) || []
        const latestRelease = releases[0] || { tag_name: '' }
    
        if (latestRelease.tag_name) {
          const latestVersion = releases[0].tag_name.charAt(0) === 'v' ? releases[0].tag_name.substring(1) : releases[0].tag_name
          const isNewerVersion = compareVersions(latestVersion, version) === 1
    
          log.verbose('Manual check found release', { currentVersion: version, latestVersion, isNewerVersion })
    
          if (isNewerVersion) {
            resolve({ version: releases[0].tag_name, location: releases[0].html_url })
          }
        } else {
          log.verbose('Manual check did not find any releases')
          reject('no releases found')
        }
      })
    }).on('error', reject)
  })
}
