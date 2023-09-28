import styled from 'styled-components'
import svg from '../../../../resources/svg'
import link from '../../../../resources/link'
import React from 'react'

import { Cluster, ClusterRow, ClusterValue } from '../../../../resources/Components/Cluster'

import Chart from '../Dashboard/PortfolioChart'
import TotalValue from '../Dashboard/TotalValue'

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  margin: auto auto;
  min-width: 900px;
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

const HomeCenter = styled.div`
  width: 65%;
  border-radius: 16px;
`
const HomeRight = styled.div`
  width: 35%;
  border-radius: 16px;
  border: 2px solid var(--ghostX);
  margin-left: 16px;
`

const CommandBar = styled.div`
  height: 64px;
  width: 100%;
  border-radius: 16px;
  background: var(--ghostAZ);
  margin-bottom: 16px;
`
const Portfolio = styled.div`
  width: 100%;
  border-radius: 16px;
  border: 2px solid var(--ghostX);
  margin-bottom: 16px;
`

const AssetList = styled.div`
  width: 100%;
  border-radius: 16px;
  border: 2px solid var(--ghostX);
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
`

const AssetItem = styled.div`
  height: 32px;
  width: 100%;
  border-bottom: 1px solid var(--ghostX);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
`

const InventoryItem = styled.div`
  height: 32px;
  width: 100%;
  border-bottom: 1px solid var(--ghostX);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
`

const ActivityItem = styled.div`
  height: 32px;
  width: 100%;
  border-bottom: 1px solid var(--ghostX);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 12px;
`

const Home = ({ data }) => (
  <>
    <Container>
      {data.station === 'command' ? (
        <CommandBar />
      ) : data.station === 'dashboard' ? (
        <>
          <HomeCenter>
            <TotalValue />
            <Portfolio>
              <Chart />
            </Portfolio>
            <AssetList>
              <AssetItem>{'Asset Item 1'}</AssetItem>
              <AssetItem>{'Asset Item 2'}</AssetItem>
              <AssetItem>{'Asset Item 3'}</AssetItem>
              <AssetItem>{'Asset Item 4'}</AssetItem>
              <AssetItem>{'Asset Item 5'}</AssetItem>
              <AssetItem>{'Asset Item 6'}</AssetItem>
              <AssetItem>{'Asset Item 7'}</AssetItem>
              <AssetItem>{'Asset Item 8'}</AssetItem>
            </AssetList>
            <AssetList>
              <InventoryItem>{'Inventory Item 1'}</InventoryItem>
              <InventoryItem>{'Inventory Item 2'}</InventoryItem>
              <InventoryItem>{'Inventory Item 3'}</InventoryItem>
              <InventoryItem>{'Inventory Item 4'}</InventoryItem>
              <InventoryItem>{'Inventory Item 5'}</InventoryItem>
              <InventoryItem>{'Inventory Item 6'}</InventoryItem>
              <InventoryItem>{'Inventory Item 7'}</InventoryItem>
              <InventoryItem>{'Inventory Item 8'}</InventoryItem>
            </AssetList>
          </HomeCenter>
          <HomeRight>
            <ActivityItem>{'Account activity'}</ActivityItem>
            <ActivityItem>{'Account activity'}</ActivityItem>
            <ActivityItem>{'Account activity'}</ActivityItem>
            <ActivityItem>{'Account activity'}</ActivityItem>
            <ActivityItem>{'Account activity'}</ActivityItem>
            <ActivityItem>{'Account activity'}</ActivityItem>
            <ActivityItem>{'Account activity'}</ActivityItem>
            <ActivityItem>{'Account activity'}</ActivityItem>
            <ActivityItem>{'Account activity'}</ActivityItem>
            <ActivityItem>{'Account activity'}</ActivityItem>
          </HomeRight>
        </>
      ) : (
        <pre>{JSON.stringify(data, null, 4)}</pre>
      )}
    </Container>
  </>
)

export default Home
