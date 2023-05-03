import { globalShortcut } from 'electron'
import { registerShortcut } from '../../../main/keyboardShortcuts'

jest.mock('electron', () => ({
  app: { on: jest.fn(), getName: jest.fn(), getVersion: jest.fn(), getPath: jest.fn() },
  globalShortcut: { register: jest.fn(), unregister: jest.fn() }
}))

async function withPlatform(platform, test) {
  const originalPlatform = process.platform

  jest.resetModules()
  Object.defineProperty(process, 'platform', {
    value: platform
  })

  await test()

  Object.defineProperty(process, 'platform', {
    value: originalPlatform
  })
  jest.resetModules()
}

describe('registerShortcut', () => {
  describe('on MacOS', () => {
    it('should unregister an existing shortcut', () => {
      withPlatform('darwin', () => {
        registerShortcut(
          'test',
          {
            shortcutKey: 'Slash',
            modifierKeys: ['Alt'],
            enabled: true,
            configuring: false
          },
          () => {}
        )

        expect(globalShortcut.unregister).toHaveBeenCalledWith('Alt+/')
        expect(globalShortcut.unregister).toHaveBeenCalledTimes(1)
      })
    })

    it('should register the new shortcut', () => {
      withPlatform('darwin', () => {
        registerShortcut(
          'test',
          {
            shortcutKey: 'Slash',
            modifierKeys: ['Alt'],
            enabled: true,
            configuring: false
          },
          () => {}
        )

        expect(globalShortcut.register).toHaveBeenCalledWith('Alt+/', expect.any(Function))
        expect(globalShortcut.register).toHaveBeenCalledTimes(1)
      })
    })
  })
})
