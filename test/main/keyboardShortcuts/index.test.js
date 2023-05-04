import { globalShortcut } from 'electron'
import store from '../../../main/store'

jest.mock('electron', () => ({
  app: { on: jest.fn(), getName: jest.fn(), getVersion: jest.fn(), getPath: jest.fn() },
  globalShortcut: { register: jest.fn(), unregister: jest.fn() }
}))
jest.mock('../../../main/store/state', () => () => ({ keyboardLayout: { isUS: true } }))
jest.mock('../../../main/accounts', () => ({ updatePendingFees: jest.fn() }))
jest.mock('../../../main/store/persist')

async function withPlatform(platform, test) {
  const originalPlatform = process.platform
  Object.defineProperty(process, 'platform', {
    value: platform
  })

  await test()

  Object.defineProperty(process, 'platform', {
    value: originalPlatform
  })
}

let registerShortcut

describe('registerShortcut', () => {
  const shortcut = {
    shortcutKey: 'Slash',
    modifierKeys: ['Alt'],
    enabled: true,
    configuring: false
  }

  beforeEach(async () => {
    const keyboardShortcuts = await import('../../../main/keyboardShortcuts')
    registerShortcut = keyboardShortcuts.registerShortcut
  })

  describe('on MacOS', () => {
    it('should unregister an existing shortcut', () => {
      withPlatform('darwin', () => {
        registerShortcut('test', shortcut, () => {})

        expect(globalShortcut.unregister).toHaveBeenCalledWith('Alt+/')
        expect(globalShortcut.unregister).toHaveBeenCalledTimes(1)
      })
    })

    it('should register the new shortcut', () => {
      withPlatform('darwin', () => {
        registerShortcut('test', shortcut, () => {})

        expect(globalShortcut.register).toHaveBeenCalledWith('Alt+/', expect.any(Function))
        expect(globalShortcut.register).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('on Windows', () => {
    describe('when registering a shortcut without an Alt modifier and a US keyboard layout', () => {
      beforeEach(() => {
        shortcut.modifierKeys = ['Control']
        store.setKeyboardLayout({ isUS: true })
      })

      it('should unregister the requested shortcut', () => {
        withPlatform('win32', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.unregister).toHaveBeenCalledWith('Control+/')
          expect(globalShortcut.unregister).toHaveBeenCalledTimes(1)
        })
      })

      it('should register the requested shortcut', () => {
        withPlatform('win32', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.register).toHaveBeenCalledWith('Control+/', expect.any(Function))
          expect(globalShortcut.register).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe('when registering a shortcut without an Alt modifier and a Non-US keyboard layout', () => {
      beforeEach(() => {
        shortcut.modifierKeys = ['Control']
        store.setKeyboardLayout({ isUS: false })
      })

      it('should unregister the requested shortcut and an AltGr shortcut', () => {
        withPlatform('win32', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.unregister).toHaveBeenCalledWith('Control+/')
          expect(globalShortcut.unregister).toHaveBeenCalledWith('Alt+Control+/')
          expect(globalShortcut.unregister).toHaveBeenCalledTimes(2)
        })
      })

      it('should register the requested shortcut', () => {
        withPlatform('win32', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.register).toHaveBeenCalledWith('Control+/', expect.any(Function))
          expect(globalShortcut.register).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe('when registering a shortcut with an AltGr modifier', () => {
      beforeEach(() => {
        shortcut.modifierKeys = ['AltGr']
        store.setKeyboardLayout({ isUS: false })
      })

      it('should unregister the equivalent Alt-based shortcut and an AltGr shortcut', () => {
        withPlatform('win32', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.unregister).toHaveBeenCalledWith('Alt+/')
          expect(globalShortcut.unregister).toHaveBeenCalledWith('Alt+Control+/')
          expect(globalShortcut.unregister).toHaveBeenCalledTimes(2)
        })
      })

      it('should register the equivalent Alt-based shortcut and an AltGr shortcut', () => {
        withPlatform('win32', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.register).toHaveBeenCalledWith('Alt+/', expect.any(Function))
          expect(globalShortcut.register).toHaveBeenCalledWith('Alt+Control+/', expect.any(Function))
          expect(globalShortcut.register).toHaveBeenCalledTimes(2)
        })
      })
    })

    describe('when registering a shortcut with an Alt modifier and a US keyboard layout', () => {
      beforeEach(() => {
        shortcut.modifierKeys = ['Alt']
        store.setKeyboardLayout({ isUS: true })
      })

      it('should unregister the requested shortcut', () => {
        withPlatform('win32', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.unregister).toHaveBeenCalledWith('Alt+/')
          expect(globalShortcut.unregister).toHaveBeenCalledTimes(1)
        })
      })

      it('should register the requested shortcut', () => {
        withPlatform('win32', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.register).toHaveBeenCalledWith('Alt+/', expect.any(Function))
          expect(globalShortcut.register).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe('when registering a shortcut with an Alt modifier and a Non-US keyboard layout', () => {
      beforeEach(() => {
        shortcut.modifierKeys = ['Alt']
        store.setKeyboardLayout({ isUS: false })
      })

      it('should unregister the equivalent Alt-based shortcut and an AltGr shortcut', () => {
        withPlatform('win32', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.unregister).toHaveBeenCalledWith('Alt+/')
          expect(globalShortcut.unregister).toHaveBeenCalledWith('Alt+Control+/')
          expect(globalShortcut.unregister).toHaveBeenCalledTimes(2)
        })
      })

      it('should register the equivalent Alt-based shortcut and an AltGr shortcut', () => {
        withPlatform('win32', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.register).toHaveBeenCalledWith('Alt+/', expect.any(Function))
          expect(globalShortcut.register).toHaveBeenCalledWith('Alt+Control+/', expect.any(Function))
          expect(globalShortcut.register).toHaveBeenCalledTimes(2)
        })
      })
    })
  })

  describe('on Linux', () => {
    describe('when registering a shortcut without an Alt modifier', () => {
      beforeEach(() => {
        shortcut.modifierKeys = ['Control']
      })

      it('should unregister the requested shortcut and an AltGr shortcut', () => {
        withPlatform('linux', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.unregister).toHaveBeenCalledWith('Control+/')
          expect(globalShortcut.unregister).toHaveBeenCalledWith('AltRight+Control+/')
          expect(globalShortcut.unregister).toHaveBeenCalledTimes(2)
        })
      })

      it('should register the requested shortcut', () => {
        withPlatform('linux', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.register).toHaveBeenCalledWith('Control+/', expect.any(Function))
          expect(globalShortcut.register).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe('when registering a shortcut with an AltGr modifier', () => {
      beforeEach(() => {
        shortcut.modifierKeys = ['AltGr']
        store.setKeyboardLayout({ isUS: false })
      })

      it('should unregister the equivalent Alt-based shortcut and an AltGr shortcut', () => {
        withPlatform('linux', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.unregister).toHaveBeenCalledWith('Alt+/')
          expect(globalShortcut.unregister).toHaveBeenCalledWith('AltRight+/')
          expect(globalShortcut.unregister).toHaveBeenCalledTimes(2)
        })
      })

      it('should register the equivalent Alt-based shortcut and an AltGr shortcut', () => {
        withPlatform('linux', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.register).toHaveBeenCalledWith('Alt+/', expect.any(Function))
          expect(globalShortcut.register).toHaveBeenCalledWith('AltRight+/', expect.any(Function))
          expect(globalShortcut.register).toHaveBeenCalledTimes(2)
        })
      })
    })

    describe('when registering a shortcut with an Alt modifier and a US keyboard layout', () => {
      beforeEach(() => {
        shortcut.modifierKeys = ['Alt']
        store.setKeyboardLayout({ isUS: true })
      })

      it('should unregister the requested shortcut', () => {
        withPlatform('linux', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.unregister).toHaveBeenCalledWith('Alt+/')
          expect(globalShortcut.unregister).toHaveBeenCalledTimes(1)
        })
      })

      it('should register the requested shortcut', () => {
        withPlatform('linux', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.register).toHaveBeenCalledWith('Alt+/', expect.any(Function))
          expect(globalShortcut.register).toHaveBeenCalledTimes(1)
        })
      })
    })

    describe('when registering a shortcut with an Alt modifier and a Non-US keyboard layout', () => {
      beforeEach(() => {
        shortcut.modifierKeys = ['Alt']
        store.setKeyboardLayout({ isUS: false })
      })

      it('should unregister the equivalent Alt-based shortcut and an AltGr shortcut', () => {
        withPlatform('linux', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.unregister).toHaveBeenCalledWith('Alt+/')
          expect(globalShortcut.unregister).toHaveBeenCalledWith('AltRight+/')
          expect(globalShortcut.unregister).toHaveBeenCalledTimes(2)
        })
      })

      it('should register the equivalent Alt-based shortcut and an AltGr shortcut', () => {
        withPlatform('linux', () => {
          registerShortcut('test', shortcut, () => {})

          expect(globalShortcut.register).toHaveBeenCalledWith('Alt+/', expect.any(Function))
          expect(globalShortcut.register).toHaveBeenCalledWith('AltRight+/', expect.any(Function))
          expect(globalShortcut.register).toHaveBeenCalledTimes(2)
        })
      })
    })
  })
})
