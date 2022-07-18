import log from 'electron-log'


import nock from 'nock'
import checkForUpdates from '../../../main/updater/manualCheck'
import packageInfo from '../../../package.json'

beforeAll(() => {
  nock.disableNetConnect()
  log.transports.console.level = false
})

afterAll(() => {
  nock.cleanAll()
  nock.enableNetConnect()
  log.transports.console.level = 'debug'
})

it('identifies that a newer version is available', async () => {
  const version = packageInfo.version
  const nextVersion = version.slice(0, version.length - 1) + (parseInt(version[version.length -1]) + 1)

  const releases = [{
    html_url: 'https://frame.sh/the-next-great-release',
    prerelease: false,
    tag_name: nextVersion
  }]

  mockApiResponse(200, releases)

  const res = await checkForUpdates()

  expect(res.version).toBe(nextVersion)
  expect(res.location).toBe('https://frame.sh/the-next-great-release')
})

it('identifies that a newer version is not available', async () => {
  const version = packageInfo.version
  const nextVersion = version

  const releases = [{
    html_url: 'https://frame.sh/the-next-great-release',
    prerelease: false,
    tag_name: nextVersion
  }]

  mockApiResponse(200, releases)

  return expect(checkForUpdates({ prereleaseTrack: false })).rejects.toBeDefined()
})

it('ignores a release on the prerelease track', () => {
  const releases = [{
    html_url: 'https://frame.sh/the-next-great-release',
    prerelease: true,
    tag_name: 'latest'
  }]

  mockApiResponse(200, releases)

  return expect(checkForUpdates({ prereleaseTrack: false })).rejects.toBeDefined()
})

it('handles an HTTP status error', async () => {
  mockApiResponse(404, '{}')

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

function mockApiResponse (status, body, headers = { 'content-type': 'application/json' }) {
  nock('https://api.github.com')
  .get('/repos/floating/frame/releases')
  .reply(status, body, headers)
}
