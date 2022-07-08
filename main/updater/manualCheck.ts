import log from 'electron-log'
import https from 'https'
import semver from 'semver'

import packageInfo from '../../package.json'
import { sendError, sendMessage } from '../worker'

const httpOptions = {
  host: 'api.github.com',
  path: '/repos/floating/frame/releases',
  headers: { 'User-Agent': 'request' }
}

const version = packageInfo.version
const isPrereleaseTrack = process.argv.includes('--prerelease')

interface GithubRelease {
  prerelease: boolean,
  tag_name: string,
  html_url: string
}

function parseResponse (rawData: string) {
  return JSON.parse(rawData) as GithubRelease[]
}

function compareVersions (a: string, b: string) {
  if (semver.gt(a, b)) return 1
  if (semver.lt(a, b)) return -1
  return 0
}

process.on('uncaughtException', sendError)

log.verbose('Performing manual check for updates', { isPrereleaseTrack })

https.get(httpOptions, res => {
  let rawData = ''

  res.on('data', chunk => { rawData += chunk })
  res.on('end', () => {
    const releases = parseResponse(rawData).filter(r => (!r.prerelease || isPrereleaseTrack)) || []
    const latestRelease = releases[0] || { tag_name: '' }

    if (latestRelease.tag_name) {
      const latestVersion = releases[0].tag_name.charAt(0) === 'v' ? releases[0].tag_name.substring(1) : releases[0].tag_name
      const isNewerVersion = compareVersions(latestVersion, version) === 1

      log.verbose('Manual check found release', { currentVersion: version, latestVersion, isNewerVersion })

      if (isNewerVersion) {
        sendMessage('update-available', { version: releases[0].tag_name, location: releases[0].html_url })
      }
    } else {
      log.verbose('Manual check did not find any releases')
    }
  })
})
