import https from 'https'

const httpOptions = {
  host: 'api.github.com',
  path: '/repos/floating/frame/releases',
  headers: { 'User-Agent': 'request' }
}

function logError (err) {
  console.error('Error checking for manual update', err)
}

// process.on('uncaughtException', e => console.error('uncuachut', e))

process.send({ fruit: 'orange' })

//process.on('uncaughtException', err => console.error('UNHANDLED ERROR', err))
// https.get(httpOptions, res => {
//   let rawData = ''

//   res.on('data', chunk => { rawData += chunk })
//   res.on('end', () => {
//     const releases = parseResponse(rawData).filter(r => (!r.prerelease || isPrereleaseTrack)) || []
//     const latestRelease = releases[0] || { tag_name: '' }
    
//     // if (latestRelease.tag_name && !updater.notified[releases[0].tag_name]) {
//     //   const newVersion = releases[0].tag_name.charAt(0) === 'v' ? releases[0].tag_name.substring(1) : releases[0].tag_name
//     //   if (compareVersions(newVersion, version) === 1) {
//     //     log.info('Updater: Current version is behind latest')
//     //     log.info('Updater: User has not been notified of this version yet')
//     //     log.info('Updater: Notify user')
//     //     updater.updateAvailable(releases[0].tag_name, releases[0].html_url)
//     //   }
//     // }
//   })
//   throw new Error('testing!')
// })
