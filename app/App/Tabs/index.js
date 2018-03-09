/* globals ResizeObserver */

import React from 'react'
import Restore from 'react-restore'
import octicons from 'octicons'

class Tabs extends React.Component {
  constructor (...args) {
    super(...args)
    this.pressedTab = {id: null, index: null}
    this.state = {width: 0, tabWidth: 0}
  }
  tabSVG = (w = 200, h = 27) => {
    if (w < 30) w = 30
    w += 10
    let hw = (w / 2) + 2
    return (`
      <svg version='1.1' xmlns='http://www.w3.org/2000/svg'>
        <defs>
          <symbol id="topleft" viewBox='0 0 ${hw} ${h}'>
            <path d="M14.3 0.1L${w} 0.1 ${w} ${h} 0 ${h}C0 ${h} 12.2 2.6 13.2 1.1 14.3-0.4 14.3 0.1 14.3 0.1Z"/>
          </symbol>
          <symbol id='topright' viewBox='0 0 ${hw} ${h}'>
            <use xlink:href='#topleft'/>
          </symbol>
          <clipPath id='crop'>
            <rect class='mask' width='50%' height='100%' x='0%'/>
          </clipPath>
        </defs>
        <svg width='50%' height='100%' transfrom='scale(-1, 1)'>
          <use xlink:href='#topleft' width='${hw}' height='${h}' class='tabSVG'/>
        </svg>
        <g transform='scale(-1, 1)'>
          <svg width='50%' height='100%' x='-${w + 4}' y='0'>
            <use xlink:href='#topright' width='${hw}' height='${h}' class='tabSVG'/>
          </svg>
        </g>
      </svg>
    `)
  }
  componentDidMount = () => {
    new ResizeObserver(this.setTabConstraints).observe(this.tabs)
    this.store.observer(_ => this.setTabConstraints())
  }
  setTabConstraints = _ => {
    let tabCount = this.store('view.list').length
    this.setState(state => {
      state.width = this.tabs.offsetWidth
      state.tabWidth = state.width / tabCount
      if (state.tabWidth > 200) state.tabWidth = 200
      return state
    })
  }
  tabDrag = e => {
    this.currentX = e.pageX
    this.currentL = this.startL + (this.currentX - this.startX)
    if (this.currentL < 0) this.currentL = 0
    if (this.currentL > this.state.width - this.state.tabWidth) this.currentL = this.state.width - this.state.tabWidth
    if (this.currentX - this.startX > ((this.state.tabWidth * 0.7) + (this.state.tabWidth * this.slide)) && this.pressedTab.index < this.store('view.list').length - 1) {
      this.store.reorderTabs(this.pressedTab.index, this.pressedTab.index + 1)
      this.pressedTab.index++
      this.slide++
      this.store.setCurrent(this.pressedTab.id)
    } else if (this.currentX - this.startX < ((-this.state.tabWidth * 0.7) + (this.state.tabWidth * this.slide)) && this.pressedTab.index > 0) {
      this.store.reorderTabs(this.pressedTab.index, this.pressedTab.index - 1)
      this.pressedTab.index--
      this.slide--
      this.store.setCurrent(this.pressedTab.id)
    }
    this.forceUpdate()
  }
  releaseDrag = () => {
    this.pressedTab = {id: null, index: null}
    this.forceUpdate()
    window.removeEventListener('mousemove', this.tabDrag)
    window.removeEventListener('mouseup', this.releaseDrag)
  }
  onMouseDown = (e, id, index) => {
    this.store.setCurrent(id)
    this.pressedTab = {id, index}
    this.startL = this.currentL = this.state.tabWidth * index
    this.startX = this.currentX = e.pageX
    this.slide = 0
    window.addEventListener('mousemove', this.tabDrag)
    window.addEventListener('mouseup', this.releaseDrag)
  }
  renderTabs () {
    return this.store('view.list').map((id, i) => {
      let style = {
        width: this.state.tabWidth + 'px',
        left: this.pressedTab.index === i ? this.currentL : (this.state.tabWidth * i) + 'px',
        zIndex: this.store('view.current') === id ? 3000 : 1000 - i
      }
      return (
        <div className={this.store('view.current') === id ? 'tab currentTab' : 'tab'} key={id} style={style} onMouseDown={(e) => this.onMouseDown(e, id, i)}>
          <div className={'tabClose'} onClick={() => this.store.events.emit('closeView', id)}>
            <div className={'tabCloseButton'}>
              <span dangerouslySetInnerHTML={{__html: octicons['x'].toSVG({height: 12})}} />
            </div>
          </div>
          <div className={'tabIcon'}>
            <img className={'tabIconImg'} src={'https://www.google.com/s2/favicons?domain_url=' + this.store('view.data', id, 'url')} />
          </div>
          <div className={'title'}>{this.store('view.data', id, 'title')}</div>
          <div className={'bg'} dangerouslySetInnerHTML={{__html: this.tabSVG(this.state.tabWidth)}} />
        </div>
      )
    })
  }
  render () {
    return (
      <div id='tabs' ref={tabs => { this.tabs = tabs }}>
        {this.state.width ? (
          <div id='tabsInset'>
            {this.renderTabs()}
            <div className='newTab' onClick={() => this.store.newView()} style={{left: (this.store('view.list').length * this.state.tabWidth)}}>+</div>
          </div>
        ) : null}
      </div>
    )
  }
}

export default Restore.connect(Tabs)
