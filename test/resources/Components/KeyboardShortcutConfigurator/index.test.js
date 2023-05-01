import React from 'react'

import link from '../../../../resources/link'
import { render, screen } from '../../../componentSetup'

let KeyboardShortcutConfigurator
let mockLayoutGetKey

jest.mock('../../../../resources/link', () => ({ send: jest.fn() }))

beforeEach(async () => {
  mockLayoutGetKey = jest.fn()
  global.navigator.keyboard = {}
  global.navigator.keyboard.getLayoutMap = jest.fn().mockResolvedValue({
    get: mockLayoutGetKey
  })
  KeyboardShortcutConfigurator = (
    await import('../../../../resources/Components/KeyboardShortcutConfigurator')
  ).default
  mockLayoutGetKey.mockImplementation((key) => {
    const keyMap = {
      Slash: '/'
    }
    return keyMap[key] || key
  })
})

it('should render an existing shortcut', () => {
  render(
    <KeyboardShortcutConfigurator
      actionText='Test this component'
      platform='linux'
      shortcutName='Test'
      shortcut={{
        modifierKeys: ['Alt'],
        shortcutKey: 'Slash',
        enabled: true,
        configuring: false
      }}
    />
  )

  const displayedShortcut = screen.getByLabelText('To Test this component press')
  expect(displayedShortcut.textContent).toBe('Alt+/')
})

it('should render an existing Meta key shortcut on MacOS', () => {
  render(
    <KeyboardShortcutConfigurator
      actionText='Test this component'
      platform='darwin'
      shortcutName='Test'
      shortcut={{
        modifierKeys: ['Meta'],
        shortcutKey: 'Slash',
        enabled: true,
        configuring: false
      }}
    />
  )

  const displayedShortcut = screen.getByLabelText('To Test this component press')
  expect(displayedShortcut.textContent).toBe('Command+/')
})

it('should render an existing Alt key shortcut on MacOS', () => {
  render(
    <KeyboardShortcutConfigurator
      actionText='Test this component'
      platform='darwin'
      shortcutName='Test'
      shortcut={{
        modifierKeys: ['Alt'],
        shortcutKey: 'Slash',
        enabled: true
      }}
    />
  )

  const displayedShortcut = screen.getByLabelText('To Test this component press')
  expect(displayedShortcut.textContent).toBe('Option+/')
})

it('should render an existing Meta key shortcut on Windows', () => {
  render(
    <KeyboardShortcutConfigurator
      actionText='Test this component'
      platform='win32'
      shortcutName='Test'
      shortcut={{
        modifierKeys: ['Meta'],
        shortcutKey: 'Slash',
        enabled: true,
        configuring: false
      }}
    />
  )

  const displayedShortcut = screen.getByLabelText('To Test this component press')
  expect(displayedShortcut.textContent).toBe('Win+/')
})

describe('when configuring', () => {
  it('should prompt to enter a shortcut', async () => {
    render(
      <KeyboardShortcutConfigurator
        actionText='Test this component'
        platform='linux'
        shortcutName='Test'
        shortcut={{
          modifierKeys: ['Meta'],
          shortcutKey: 'Slash',
          enabled: true,
          configuring: true
        }}
      />
    )

    const enterShortcutPrompt = screen.getByText('Enter new keyboard shortcut!')
    expect(enterShortcutPrompt).toBeDefined()
  })

  describe('and a valid shortcut is entered', () => {
    it('should set the new shortcut', async () => {
      const { user } = render(
        <KeyboardShortcutConfigurator
          actionText='Test this component'
          platform='linux'
          shortcutName='Test'
          shortcut={{
            modifierKeys: ['Meta'],
            shortcutKey: 'Slash',
            enabled: true,
            configuring: true
          }}
        />
      )

      const enterShortcutPrompt = screen.getByText('Enter new keyboard shortcut!')
      expect(enterShortcutPrompt).toBeDefined()
      await user.keyboard('{Alt>}T{/Alt}')

      expect(link.send).toHaveBeenLastCalledWith('tray:action', 'setShortcut', 'Test', {
        enabled: true,
        configuring: false,
        nonUSLayout: false,
        modifierKeys: ['Alt'],
        shortcutKey: 'KeyT'
      })
    })

    it('should enable a new shortcut when the previous one was disabled', async () => {
      const { user } = render(
        <KeyboardShortcutConfigurator
          actionText='Test this component'
          platform='linux'
          shortcutName='Test'
          shortcut={{
            modifierKeys: ['Meta'],
            shortcutKey: 'Slash',
            enabled: false,
            configuring: true
          }}
        />
      )

      const enterShortcutPrompt = screen.getByText('Enter new keyboard shortcut!')
      expect(enterShortcutPrompt).toBeDefined()
      await user.keyboard('{Alt>}T{/Alt}')

      expect(link.send).toHaveBeenLastCalledWith('tray:action', 'setShortcut', 'Test', {
        enabled: true,
        configuring: false,
        nonUSLayout: false,
        modifierKeys: ['Alt'],
        shortcutKey: 'KeyT'
      })
    })
  })

  describe('and an invalid shortcut is entered', () => {
    it('should not set a new shortcut', async () => {
      const { user } = render(
        <KeyboardShortcutConfigurator
          actionText='Test this component'
          platform='linux'
          shortcutName='Test'
          shortcut={{
            modifierKeys: ['Meta'],
            shortcutKey: 'Slash',
            enabled: true,
            configuring: true
          }}
        />
      )

      const enterShortcutPrompt = screen.getByText('Enter new keyboard shortcut!')
      expect(enterShortcutPrompt).toBeDefined()
      await user.keyboard('{Shift>};{/Shift}')

      expect(link.send).not.toHaveBeenCalled()
    })
  })
})
