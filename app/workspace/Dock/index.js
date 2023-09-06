import styled from 'styled-components'

import Native from './Native'
import Account from './Account'

import link from '../../../resources/link'
import svg from '../../../resources/svg'
import useStore from '../../../resources/Hooks/useStore'

const Dock = styled.div`
  position: absolute;
  overflow: hidden;
  top: 8px;
  bottom: 8px;
  left: 8px;
  width: 300px;
  z-index: 9999;
  /* background: linear-gradient(135deg, var(--ghostA), var(--ghostAZ)); */
  /* border: 1px solid linear-gradient(135deg, red, var(--ghostAZ)); */
  background: var(--ghostAZ);
  border-radius: 8px;
  box-shadow: 0px 0px 8px var(--ghostY);
  text-align: center;
`
const DockBottom = styled.div`
  position: absolute;
  bottom: 8px;
  left: 0px;
  right: 0px;
`

const DockBody = styled.div`
  position: absolute;
  bottom: 8px;
  left: 0px;
  right: 0px;
  top: 46px;
`

const Options = styled.div`
  /* border-radius: 16px; */
  width: calc(100%);
  overflow: hidden;
  font-size: 13px;
  font-weight: 400;
`
const OptionButton = styled.div`
  height: 32px;
  margin: 0px 8px 8px 8px;
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--ghostAZ);
  border-radius: 8px;
  box-shadow: 2px 2px 4px var(--ghostZ), -2px -2px 4px var(--ghostA);
  cursor: pointer;
  &:hover {
    background: var(--ghostB);
  }

  &:last-child {
    border-bottom: 1px solid transparent;
  }

  &:hover {
    background: var(--ghostA);
  }
`

export default () => {
  const frameState = useStore('windows.workspaces', frameId)
  const nav = frameState?.nav[0] || { space: 'command', data: {} }
  if (!nav || !nav.space) return null

  const { space } = nav

  return (
    <Dock>
      <Native />
      {space === 'accounts' ? (
        <DockBody>
          {/* <div>{'Accounts'}</div> */}
          <Options>
            <OptionButton
              onClick={() => {
                link.send('workspace:nav', window.frameId, 'accounts', { view: 'manager' })
              }}
            >
              {'accounts'}
            </OptionButton>
            <OptionButton
              onClick={() => {
                link.send('workspace:nav', window.frameId, 'accounts', { view: 'signers' })
              }}
            >
              {'signers'}
            </OptionButton>
          </Options>
        </DockBody>
      ) : (
        <DockBody>
          <Account />
          <DockBottom>
            <Options>
              <OptionButton
                onClick={() => {
                  link.send('workspace:nav', window.frameId, 'accounts')
                }}
              >
                {'accounts'}
              </OptionButton>
              <OptionButton
                onClick={() => {
                  link.send('workspace:nav', window.frameId, 'chains')
                }}
              >
                {'chains'}
              </OptionButton>
              <OptionButton
                onClick={() => {
                  link.send('workspace:nav', window.frameId, 'dapps')
                }}
              >
                {'dapps'}
              </OptionButton>
              <OptionButton
                onClick={() => {
                  link.send('workspace:nav', window.frameId, 'settings')
                }}
              >
                {'settings'}
              </OptionButton>
            </Options>

            <div className='snipIt'>
              <div>Inject Frame to any browser with our companion extension!</div>
              <div className='snipItBrowserExtensionIcons'>
                <div
                  className='snipItBrowserExtensionIcon snipItBrowserExtensionIconChrome'
                  onClick={() =>
                    link.send(
                      'tray:openExternal',
                      'https://chrome.google.com/webstore/detail/frame-alpha/ldcoohedfbjoobcadoglnnmmfbdlmmhf'
                    )
                  }
                >
                  {svg.chrome(28)}
                </div>
                <div
                  className='snipItBrowserExtensionIcon snipItBrowserExtensionIconFirefox'
                  onClick={() =>
                    link.send(
                      'tray:openExternal',
                      'https://addons.mozilla.org/en-US/firefox/addon/frame-extension'
                    )
                  }
                >
                  {svg.firefox(28)}
                </div>
                {/* <div 
            className='snipItBrowserExtensionIcon snipItBrowserExtensionIconSafari'
          >
            {svg.safari(28)}
          </div> */}
              </div>
              {/* <div>Inject a connection with our browser extension!</div> */}
            </div>
            <div
              className='discordInvite'
              onClick={() => {
                link.send('tray:openExternal', 'https://feedback.frame.sh')
              }}
            >
              Request a Feature
            </div>
            <div
              className='discordInvite'
              onClick={() => {
                link.send('tray:action', 'setOnboard', { showing: true })
              }}
            >
              Open Frame Tutorial
            </div>
            <div
              className='discordInvite'
              onClick={() => link.send('tray:openExternal', 'https://discord.gg/UH7NGqY')}
            >
              <div>Need help?</div>
              <div className='discordLink'>Join our Discord!</div>
            </div>
          </DockBottom>
        </DockBody>
      )}
    </Dock>
  )
}
