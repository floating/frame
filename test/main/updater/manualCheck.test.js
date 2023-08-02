import log from 'electron-log'
import nock from 'nock'

import checkForUpdates from '../../../main/updater/manualCheck'
import packageInfo from '../../../package.json'

// response for current release
const githubReleasesResponse = [
  {
    html_url: 'https://frame.sh/the-next-great-release',
    prerelease: false,
    tag_name: packageInfo.version
  }
]

const currentVersion = packageInfo.version
const nextVersion =
  currentVersion.slice(0, currentVersion.length - 1) +
  (parseInt(currentVersion[currentVersion.length - 1]) + 1)

beforeAll(() => {
  jest.useRealTimers()

  nock.disableNetConnect()
  log.transports.console.level = false
})

afterAll(() => {
  nock.cleanAll()
  nock.enableNetConnect()
  log.transports.console.level = 'debug'
})

it('identifies that a newer version is not available', async () => {
  mockApiResponse(200, githubReleasesResponse)

  return expect(checkForUpdates()).resolves.toBeFalsy()
})

it('identifies that a newer version is available', async () => {
  const response = [
    {
      html_url: 'https://frame.sh/cutting-edge-frame-release',
      prerelease: true,
      tag_name: `v${nextVersion}`
    },
    ...githubReleasesResponse
  ]

  mockApiResponse(200, response)

  const res = await checkForUpdates({ prereleaseTrack: true })

  expect(res.version).toBe(`v${nextVersion}`)
  expect(res.location).toBe('https://frame.sh/cutting-edge-frame-release')
})

it('ignores a release on the prerelease track', () => {
  const response = [
    {
      html_url: 'https://frame.sh/cutting-edge-frame-release',
      prerelease: true,
      tag_name: `v${nextVersion}`
    },
    ...githubReleasesResponse
  ]

  mockApiResponse(200, response)

  return expect(checkForUpdates({ prereleaseTrack: false })).resolves.toBeFalsy()
})

it('handles an HTTP status error', async () => {
  mockApiResponse(403, '{"message":"API rate limit exceeded"}')

  return expect(checkForUpdates()).rejects.toBeDefined()
})

it('handles a non-JSON response', async () => {
  mockApiResponse(200, '', { 'content-type': 'text/html' })

  return expect(checkForUpdates()).rejects.toBeDefined()
})

it('handles an error parsing the JSON response', async () => {
  mockApiResponse(200, 'test')

  return expect(checkForUpdates()).rejects.toBeDefined()
})

function mockApiResponse(status, body, headers = { 'content-type': 'application/json' }) {
  nock('https://api.github.com').get('/repos/floating/frame/releases').reply(status, body, headers)
}
