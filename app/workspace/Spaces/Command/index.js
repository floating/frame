import styled from 'styled-components'
import svg from '../../../../resources/svg'
import link from '../../../../resources/link'
import React from 'react'

import { Cluster, ClusterRow, ClusterValue } from '../../../../resources/Components/Cluster'

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  margin: auto auto;
  width: 900px;
  padding-left: 64px;
`

const MainButton = styled.div`
  height: 64px;
  width: 348px;
  border-radius: 16px;
  background: var(--ghostAZ);
  cursor: pointer;
  /* background: linear-gradient(170deg, #211d23, #1c181e);
  box-shadow: 6px 6px 12px #1a171c, -6px -6px 12px #241f26; */
  /* box-shadow: 20px 20px 60px #1e1a21, -20px -20px 60px #28242d; */
  /* box-shadow: 4px 4px 6px var(--ghostA), -4px -4px 6px var(--ghostC); */
  /* box-shadow: -6px 6px 12px var(--ghostA), 5px -5px 12px #ffffff, inset -6px 6px 12px var(--ghostC),
    inset -5px -5px 14px rgba(255, 255, 255, 0.15); */
  &:hover {
    background: var(--ghostA);
  }
`

const DappRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const DappIcon = styled.div`
  width: 42px;
  height: 42px;
  margin: 0px 0px 16px 0px;
  background: var(--ghostAZ);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: var(--ghostAZ);
  border-radius: 8px;
  box-shadow: 2px 2px 4px var(--ghostY), -2px -2px 4px var(--ghostA);

  * {
    pointer-events: none;
  }
  &:hover {
    background: var(--ghostA);
  }
`

class Settings extends React.Component {
  constructor(...args) {
    super(...args)
    this.state = {
      expand: false,
      name: '',
      showMore: false,
      newName: '',
      editName: false
    }
  }
  render() {
    return (
      <div ref={this.moduleRef}>
        <div className='balancesBlock'>
          <Cluster>
            <>
              {this.state.editName ? (
                <ClusterRow>
                  <ClusterValue allowPointer={true}>
                    <div key={'input'} className='moduleItem cardShow moduleItemInput'>
                      <div className='moduleItemEditName'>
                        <input
                          autoFocus
                          type='text'
                          tabIndex='-1'
                          value={this.state.name}
                          onChange={(e) => {
                            this.setState({ name: e.target.value })
                            link.send('tray:renameAccount', this.props.account, e.target.value)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              this.setState({ editName: false })
                            }
                          }}
                        />
                      </div>
                    </div>
                  </ClusterValue>
                </ClusterRow>
              ) : (
                <ClusterRow>
                  <ClusterValue
                    onClick={() => {
                      this.setState({ editName: true })
                    }}
                  >
                    <div className='moduleItem cardShow'>{'Update Name'}</div>
                  </ClusterValue>
                </ClusterRow>
              )}
              <ClusterRow>
                <ClusterValue
                  onClick={() => {
                    link.rpc('removeAccount', this.props.account, {}, () => {})
                  }}
                  style={
                    this.state.editName
                      ? {
                          opacity: 0.3,
                          pointerEvents: 'none',
                          color: 'var(--bad)'
                        }
                      : {
                          opacity: 1,
                          color: 'var(--bad)'
                        }
                  }
                >
                  <div className='moduleItem cardShow'>{'Remove Account'}</div>
                </ClusterValue>
              </ClusterRow>
            </>
          </Cluster>
        </div>
      </div>
    )
  }
}

const HomeLeft = styled.div`
  position: absolute;
  height: 100%;
  width: 32px;
  left: 0;
`
const HomeCenter = styled.div`
  height: 400px;
  width: 65%;
  min-height: 100%;
  border-radius: 16px;
`
const HomeRight = styled.div`
  width: 35%;
  min-height: 550px;
  border-radius: 16px;
  background: var(--ghostAZ);
  margin-left: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
`
const CommandBar = styled.div`
  height: 64px;
  width: 100%;
  border-radius: 16px;
  background: var(--ghostAZ);
  margin-bottom: 16px;
`
const Portfolio = styled.div`
  height: 200px;
  width: 100%;
  border-radius: 16px;
  background: var(--ghostAZ);
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
`

const AssetList = styled.div`
  height: 200px;
  width: 100%;
  border-radius: 16px;
  background: var(--ghostAZ);
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
`

const Home = ({ data }) => (
  <Container>
    <HomeLeft>
      <DappIcon
        onClick={() => {
          link.send('workspace:run', 'dapp', {}, ['send.frame.eth'])
        }}
      >
        {svg.send(15)}
      </DappIcon>
      <DappIcon />
      <DappIcon />
      <DappIcon />
      <DappIcon />
      <DappIcon />
      <DappIcon />
      <DappIcon />
    </HomeLeft>
    <HomeCenter>
      <CommandBar />
      <Portfolio>Value</Portfolio>
      <AssetList>Assets</AssetList>
      <AssetList>Inventory</AssetList>
    </HomeCenter>
    <HomeRight>
      <div>{'Account activity'}</div>
    </HomeRight>
  </Container>
)

export default Home
