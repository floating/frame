jest.mock('electron-log', () => ({ info: console.log, warn: jest.fn(), error: jest.fn() }))
jest.mock('electron', () => ({ app: { on: jest.fn(), getPath: jest.fn() } }))
jest.mock('fs')

let mockLatestVersion = 0

jest.mock('../../../../main/store/migrate', () => {
  return {
    latest: mockLatestVersion,
    apply: (state) => {
      return mockLatestVersion === 2
        ? { ...state, main: { ...state.main, _version: 2, instanceId: 'test-brand-new-frame' } }
        : { ...state }
    }
  }
})

jest.mock('../../../../main/store/persist', () => {
  const get = (path) => {
    if (path === 'main')
      // simulate state that has already been migrated to version 2
      return {
        __: {
          1: {
            main: {
              _version: 1,
              instanceId: 'test-frame'
            }
          },
          2: {
            main: {
              _version: 2,
              instanceId: 'test-brand-new-frame'
            }
          }
        }
      }
  }

  return { get }
})

afterEach(() => {
  // ensure modules are reloaded before each test
  jest.resetModules()
})

it('maintains backwards compatible access to the current version of state', async () => {
  // load state already migrated to version 2 and make sure version 1 values are available
  mockLatestVersion = 1

  const { default: state } = await import('../../../../main/store/state')

  expect(state().main.instanceId).toBe('test-frame')
})

it('loads values from the current version of the state', async () => {
  // load state migrated to version 2 and make sure version 2 value is the one that's read
  mockLatestVersion = 2

  const { default: state } = await import('../../../../main/store/state')

  expect(state().main.instanceId).toBe('test-brand-new-frame')
})

it('preserves an older version of the state after creating a newer state entry', async () => {
  mockLatestVersion = 2

  jest.dontMock('../../../../main/store/persist')
  const { default: fs } = await import('fs')
  const { default: persist } = await import('../../../../main/store/persist')
  const { default: state } = await import('../../../../main/store/state')

  persist.set('main', state().main)

  const writtenState = JSON.parse(fs.__getWrittenData())

  expect(writtenState.main.__['1'].main.instanceId).toBe('test-frame')
  expect(writtenState.main.__['2'].main.instanceId).toBe('test-brand-new-frame')
}, 500)
